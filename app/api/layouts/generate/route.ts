/**
 * Layout Generation API
 * POST /api/layouts/generate - Generate or refine a custom layout via LLM
 *
 * Actions:
 * - action: "generate" — Initial layout generation from form data
 * - action: "refine"   — Update existing layout based on user feedback
 * - action: "chat"     — Free-form chat about the layout (returns text, not JSON)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateLayout,
  refineLayout,
  chatAboutLayout,
} from "@/lib/services/llm-service";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import JSZip from "jszip";

// ---------------------------------------------------------------------------
// Extract CSS color variables from <html style="..."> as a lookup map.
// Returns e.g. { "primary": "#db2919", "on-primary": "#ffffff", ... }
// ---------------------------------------------------------------------------

function extractColorVars(rawHtml: string): Record<string, string> {
  const htmlTagMatch = rawHtml.match(/<html[^>]*style\s*=\s*["']([^"']+)["']/i);
  if (!htmlTagMatch) return {};

  const styleAttr = htmlTagMatch[1];
  const colors: Record<string, string> = {};
  const varRegex = /--color-sf-([\w-]+)\s*:\s*([^;]+)/g;
  let m;
  while ((m = varRegex.exec(styleAttr)) !== null) {
    const rgbValues = m[2].trim().match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (rgbValues) {
      colors[m[1]] = "#" + [rgbValues[1], rgbValues[2], rgbValues[3]]
        .map(v => parseInt(v).toString(16).padStart(2, "0"))
        .join("");
    }
  }
  return colors;
}

// ---------------------------------------------------------------------------
// Convert Moveware/Angular utility CSS classes to inline styles so the HTML
// is self-describing. Claude sees "background:#db2919;color:#fff" instead of
// "bg-primary color-on-primary" which means nothing without the CSS.
// ---------------------------------------------------------------------------

function convertClassesToInlineStyles(html: string, colors: Record<string, string>): string {
  const classToStyle: Record<string, string> = {
    "bg-primary": `background-color:${colors["primary"] || "#dc2626"}`,
    "bg-secondary": `background-color:${colors["secondary"] || "#004266"}`,
    "bg-tertiary": `background-color:${colors["tertiary"] || "#344048"}`,
    "bg-white": "background-color:#ffffff",
    "bg-light-grey": `background-color:${colors["light-grey"] ? colors["light-grey"] : "#e9e9e9"}`,
    "bg-black": "background-color:#000000",
    "color-primary": `color:${colors["primary"] || "#dc2626"}`,
    "color-on-primary": `color:${colors["on-primary"] || "#ffffff"}`,
    "color-secondary": `color:${colors["secondary"] || "#004266"}`,
    "color-on-secondary": `color:${colors["on-secondary"] || "#ffffff"}`,
    "color-tertiary": `color:${colors["tertiary"] || "#344048"}`,
    "color-on-tertiary": `color:${colors["on-tertiary"] || "#f5f5f5"}`,
    "color-grey": `color:${colors["grey"] ? colors["grey"] : "#858c91"}`,
    "color-on-white": `color:${colors["on-white"] ? colors["on-white"] : "#334048"}`,
    "color-white": "color:#ffffff",
    "flex-row": "display:flex;flex-direction:row",
    "flex-col": "display:flex;flex-direction:column",
    "flex-gap": "gap:8px",
    "flex-gap-sm": "gap:4px",
    "flex-gap-md": "gap:16px",
    "flex-items-center": "align-items:center",
    "flex-content-space": "justify-content:space-between",
    "flex-content-center": "justify-content:center",
    "row": "width:100%",
    "md:w-4": "width:33.33%",
    "md:w-6": "width:50%",
    "md:w-8": "width:66.67%",
    "pad-sm": "padding:8px",
    "pad-md": "padding:16px",
    "pad-lg": "padding:24px",
    "pad-l-md": "padding-left:16px",
    "pad-r-md": "padding-right:16px",
    "pad-b-md": "padding-bottom:16px",
    "pad-b-lg": "padding-bottom:24px",
    "pad-b-xl": "padding-bottom:32px",
    "card": "background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.12);overflow:hidden",
    "border-radius-lg": "border-radius:12px",
    "border-radius-md": "border-radius:8px",
    "border-style-none": "border:none",
    "font-weight-7": "font-weight:700",
    "font-weight-4": "font-weight:400",
    "font-weight-2": "font-weight:200",
    "text-sm": "font-size:0.875rem",
    "row-gap-xl": "row-gap:32px",
    "space": "padding:32px 16px",
    "overlap-2": "margin-top:-80px;position:relative;z-index:2",
    "mt-auto": "margin-top:auto",
  };

  return html.replace(/class="([^"]*)"/g, (_match, classStr: string) => {
    const classes = classStr.trim().split(/\s+/);
    const inlineStyles: string[] = [];
    const remainingClasses: string[] = [];

    for (const cls of classes) {
      if (classToStyle[cls]) {
        inlineStyles.push(classToStyle[cls]);
      } else {
        remainingClasses.push(cls);
      }
    }

    if (inlineStyles.length === 0) return `class="${classStr}"`;

    const styleStr = inlineStyles.join(";");
    if (remainingClasses.length > 0) {
      return `style="${styleStr}" class="${remainingClasses.join(" ")}"`;
    }
    return `style="${styleStr}"`;
  });
}

// ---------------------------------------------------------------------------
// HTML cleaning — strip framework noise, convert utility classes to inline
// styles, and produce clean self-describing HTML the LLM can replicate.
// ---------------------------------------------------------------------------

function cleanHtmlForLLM(rawHtml: string): { cleanedHtml: string; imageAssets: string[] } {
  const colors = extractColorVars(rawHtml);

  let html = rawHtml;

  // Remove <script>, <noscript>, <style>, <link stylesheet>, HTML comments
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, "");
  html = html.replace(/<link\s[^>]*rel\s*=\s*["']stylesheet["'][^>]*\/?>/gi, "");
  html = html.replace(/<!--[\s\S]*?-->/g, "");

  // Remove base64 data URIs
  html = html.replace(/data:[^"'\s)]+;base64,[A-Za-z0-9+/=]{100,}/g, "data:removed");

  // Remove SVG blocks
  html = html.replace(/<svg[\s\S]*?<\/svg>/gi, "[svg-icon]");

  // Extract body only
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    html = bodyMatch[1];
  }

  // Collect image asset paths/URLs
  const imageAssets: string[] = [];
  const imgRegex = /src\s*=\s*["']([^"']+\.(?:png|jpe?g|webp|gif))[^"']*["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1].replace(/^\.\//, "");
    if (!imageAssets.includes(src)) imageAssets.push(src);
  }

  // --- Angular / Moveware framework cleanup ---

  // Strip Angular attributes
  html = html.replace(/\s+(?:_ngcontent|_nghost|ng-version|ng-reflect)[a-z0-9-]*(?:\s*=\s*"[^"]*")?/gi, "");

  // Convert framework elements to standard divs
  html = html.replace(/<lib-dynamic-container([^>]*)>/gi, '<div$1>');
  html = html.replace(/<\/lib-dynamic-container>/gi, '</div>');
  html = html.replace(/<lib-plain-html[^>]*>\s*/gi, "");
  html = html.replace(/\s*<\/lib-plain-html>/gi, "");
  html = html.replace(/<lib-image([^>]*)>/gi, '<div$1>');
  html = html.replace(/<\/lib-image>/gi, '</div>');

  // Unwrap app-root, app-rms, router-outlet, form
  html = html.replace(/<(?:app-root|app-rms|router-outlet)[^>]*>\s*/gi, "");
  html = html.replace(/<\/(?:app-root|app-rms)>/gi, "");
  html = html.replace(/<form[^>]*>\s*/gi, "");
  html = html.replace(/<\/form>/gi, "");

  // Remove empty divs
  html = html.replace(/<div[^>]*>\s*<\/div>/gi, "");

  // Remove elements with "e-hidden" class (hidden overlays/modals)
  html = html.replace(/<div[^>]*class="[^"]*e-hidden[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");

  // Remove UUID id attributes
  html = html.replace(/\s+id="[0-9a-f]{8}-[0-9a-f-]+"/gi, "");

  // Remove Angular form attributes
  html = html.replace(/\s+(?:novalidate|ng-untouched|ng-pristine|ng-valid|ng-invalid)/gi, "");

  // Convert utility CSS classes to inline styles
  html = convertClassesToInlineStyles(html, colors);

  // Clean up whitespace
  html = html.replace(/\n\s*\n\s*\n/g, "\n");
  html = html.replace(/[ \t]{3,}/g, " ");
  html = html.replace(/>\s+</g, ">\n<");

  return { cleanedHtml: html.trim(), imageAssets };
}

// ---------------------------------------------------------------------------
// List image asset filenames from a ZIP (for prompt context, not visual ref)
// ---------------------------------------------------------------------------

function listZipImageAssets(
  zip: Awaited<ReturnType<typeof JSZip.loadAsync>>,
): string[] {
  return Object.values(zip.files)
    .filter((entry) => !entry.dir && /\.(png|jpe?g|webp|gif)$/i.test(entry.name))
    .map((entry) => path.basename(entry.name));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: "action is required (generate | refine | chat)" },
        { status: 400 },
      );
    }

    // ----- Generate initial layout -----
    if (action === "generate") {
      const {
        companyName,
        brandCode,
        primaryColor,
        secondaryColor,
        tertiaryColor,
        logoUrl,
        bannerImageUrl,
        footerImageUrl,
        referenceUrl,
        referenceFilePath,
        referenceFileContent,
        description,
        conversationHistory,
      } = body;

      if (!companyName) {
        return NextResponse.json(
          {
            success: false,
            error: "companyName is required",
          },
          { status: 400 },
        );
      }

      // Description is required only if no reference URL/file is provided
      if (!description && !referenceUrl && !referenceFilePath) {
        return NextResponse.json(
          {
            success: false,
            error: "Either description, referenceUrl, or referenceFile must be provided",
          },
          { status: 400 },
        );
      }

      console.log(`[Generate] Starting layout generation for ${companyName}`);
      console.log(`[Generate] Has referenceUrl: ${!!referenceUrl}`);
      console.log(`[Generate] Has referenceFilePath: ${!!referenceFilePath}`);
      console.log(`[Generate] Description length: ${description?.length || 0}`);

      // Read and encode reference file if provided
      let effectiveReferenceFileContent = referenceFileContent as string | undefined;
      let referenceFileData = null;
      if (referenceFilePath) {
        try {
          const filePath = path.join(process.cwd(), "public", referenceFilePath.replace(/^\//, ""));
          console.log(`[Generate] Attempting to read reference file: ${filePath}`);
          
          if (existsSync(filePath)) {
            const fileBuffer = await readFile(filePath);
            const fileSizeMB = (fileBuffer.length / 1024 / 1024).toFixed(2);
            console.log(`[Generate] File size: ${fileSizeMB}MB`);
            
            // Warn if file is very large (>5MB) as it may cause issues with Claude API
            if (fileBuffer.length > 5 * 1024 * 1024) {
              console.warn(`[Generate] WARNING: File is ${fileSizeMB}MB - large files may cause issues. Consider using a smaller file or screenshot.`);
            }
            
            const base64 = fileBuffer.toString("base64");
            const ext = path.extname(filePath).toLowerCase();
            
            let mediaType = "application/pdf";
            if (ext === ".png") mediaType = "image/png";
            else if (ext === ".jpg" || ext === ".jpeg") mediaType = "image/jpeg";
            else if (ext === ".webp") mediaType = "image/webp";
            else if (ext === ".html" || ext === ".htm") mediaType = "text/html";
            else if (ext === ".zip") mediaType = "application/zip";

            if (mediaType === "text/html") {
              const rawHtml = fileBuffer.toString("utf-8");
              const { cleanedHtml, imageAssets } = cleanHtmlForLLM(rawHtml);
              effectiveReferenceFileContent = cleanedHtml;
              if (imageAssets.length > 0) {
                effectiveReferenceFileContent += `\n\n<!-- Image assets: ${imageAssets.join(", ")} -->`;
              }
              console.log(`[Generate] Loaded HTML reference (raw ${(rawHtml.length / 1024).toFixed(1)}KB → cleaned ${(cleanedHtml.length / 1024).toFixed(1)}KB)`);
            } else if (mediaType === "application/zip") {
              const zip = await JSZip.loadAsync(fileBuffer);

              const htmlCandidates = Object.values(zip.files).filter(
                (entry) => !entry.dir && /\.(html?|xhtml)$/i.test(entry.name),
              );

              if (htmlCandidates.length === 0) {
                throw new Error("ZIP file contains no HTML files");
              }

              const preferred =
                htmlCandidates.find((e) => /index|quote|home/i.test(e.name)) ||
                htmlCandidates[0];

              const rawHtml = await preferred.async("string");
              const { cleanedHtml, imageAssets } = cleanHtmlForLLM(rawHtml);

              const zipImages = listZipImageAssets(zip);
              const allImages = [...new Set([...imageAssets, ...zipImages])];

              effectiveReferenceFileContent = cleanedHtml;
              if (allImages.length > 0) {
                effectiveReferenceFileContent += `\n\n<!-- Image assets: ${allImages.join(", ")} — these are banners/logos/photos for the page content, use branding.logoUrl for logos and bannerImageUrl/footerImageUrl if provided -->`;
              }

              console.log(
                `[Generate] Loaded HTML from ZIP (${preferred.name}, raw ${(rawHtml.length / 1024).toFixed(1)}KB → cleaned ${(cleanedHtml.length / 1024).toFixed(1)}KB, images: ${allImages.length})`,
              );
            } else {
              referenceFileData = {
                data: base64,
                mediaType,
                filename: path.basename(filePath),
              };
              console.log(`[Generate] Successfully encoded reference file (${mediaType}, ${(base64.length / 1024).toFixed(2)}KB base64)`);
            }
          } else {
            console.warn(`[Generate] Reference file not found: ${filePath}`);
          }
        } catch (error) {
          console.error("[Generate] Error reading reference file:", error);
          // Don't fail the request, just log and continue without file
        }
      }

      try {
        console.log("[Generate] Calling generateLayout...");
        const layoutConfig = await generateLayout({
          companyName,
          brandCode: brandCode || "",
          primaryColor: primaryColor || "#2563eb",
          secondaryColor: secondaryColor || "#1e40af",
          tertiaryColor,
          logoUrl,
          bannerImageUrl,
          footerImageUrl,
          referenceUrl,
          referenceFileData,
          referenceFileContent: effectiveReferenceFileContent,
          description,
          conversationHistory,
        });

        console.log("[Generate] Layout generation successful");

        // Build response message with warnings
        const warnings: string[] = [];
        if (layoutConfig._urlCaptureError) {
          warnings.push(`Reference URL could not be accessed (${layoutConfig._urlCaptureError}). The layout was generated from your description only.`);
          // Remove internal field before sending to client
          delete (layoutConfig as unknown as Record<string, unknown>)._urlCaptureError;
        }
        if (referenceUrl && !referenceFileData && warnings.length > 0) {
          warnings.push("For best results, save the reference page as a PDF and upload it using the Reference File field.");
        }

        const message = warnings.length > 0
          ? `Layout generated with warnings:\n${warnings.map(w => `⚠️ ${w}`).join('\n')}\n\nReview the preview and provide feedback to refine it.`
          : "Layout generated successfully. Review the preview and provide feedback to refine it.";

        return NextResponse.json({
          success: true,
          data: layoutConfig,
          message,
          warnings,
        });
      } catch (generateError) {
        console.error("[Generate] Error in generateLayout:", generateError);
        
        // Return detailed error information
        const errorMessage = generateError instanceof Error 
          ? generateError.message 
          : "Unknown error during layout generation";
        
        const errorDetails = generateError instanceof Error
          ? {
              message: generateError.message,
              stack: generateError.stack?.substring(0, 500),
              name: generateError.name,
            }
          : { error: String(generateError) };

        console.error("[Generate] Error details:", JSON.stringify(errorDetails, null, 2));

        return NextResponse.json(
          {
            success: false,
            error: `Layout generation failed: ${errorMessage}`,
            details: errorDetails,
          },
          { status: 500 },
        );
      }
    }

    // ----- Refine existing layout -----
    if (action === "refine") {
      const {
        currentConfig,
        feedback,
        conversationHistory,
        companyName,
        primaryColor,
        secondaryColor,
      } = body;

      if (!currentConfig || !feedback) {
        return NextResponse.json(
          {
            success: false,
            error: "currentConfig and feedback are required for refinement",
          },
          { status: 400 },
        );
      }

      const layoutConfig = await refineLayout({
        currentConfig,
        feedback,
        conversationHistory: conversationHistory || [],
        companyName: companyName || "Unknown",
        primaryColor: primaryColor || "#2563eb",
        secondaryColor: secondaryColor || "#1e40af",
      });

      // If the AI answered a question without making a layout change it
      // sets a top-level "reply" field — surface that as the message.
      const replyField = (layoutConfig as unknown as Record<string, unknown>).reply as string | undefined;
      if (replyField) {
        delete (layoutConfig as unknown as Record<string, unknown>).reply;
      }

      // Detect when the AI returned the layout unchanged (no actual edit applied).
      const configChanged = JSON.stringify(layoutConfig) !== JSON.stringify(currentConfig);
      let responseMessage = replyField || "Layout updated based on your feedback.";
      if (!configChanged && !replyField) {
        responseMessage =
          "I wasn't able to locate the exact element to change. Could you describe it differently? " +
          "For example, mention a specific section name, the text it contains, or whether it's in the header, a content block, or the form.";
      }

      return NextResponse.json({
        success: true,
        data: layoutConfig,
        message: responseMessage,
        noChange: !configChanged && !replyField,
      });
    }

    // ----- Chat about layout -----
    if (action === "chat") {
      const { message, conversationHistory, companyName } = body;

      if (!message) {
        return NextResponse.json(
          { success: false, error: "message is required for chat" },
          { status: 400 },
        );
      }

      const reply = await chatAboutLayout(
        message,
        conversationHistory || [],
        companyName || "Unknown",
      );

      return NextResponse.json({
        success: true,
        message: reply,
      });
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error in layout generation:", error);
    const message =
      error instanceof Error ? error.message : "Failed to process request";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
