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
// CSS variable extraction — pull color definitions from <html style="...">
// so the LLM knows what utility classes like bg-primary actually mean.
// ---------------------------------------------------------------------------

function extractCssColorContext(rawHtml: string): string {
  const htmlTagMatch = rawHtml.match(/<html[^>]*style\s*=\s*["']([^"']+)["']/i);
  if (!htmlTagMatch) return "";

  const styleAttr = htmlTagMatch[1];
  const vars: Record<string, string> = {};
  const varRegex = /--([\w-]+)\s*:\s*([^;]+)/g;
  let m;
  while ((m = varRegex.exec(styleAttr)) !== null) {
    vars[m[1]] = m[2].trim();
  }

  if (Object.keys(vars).length === 0) return "";

  const lines: string[] = ["Color/theme variables from the original page:"];
  for (const [name, value] of Object.entries(vars)) {
    if (/color|primary|secondary|tertiary|grey|white|black|error|success|warning/i.test(name)) {
      const rgbValues = value.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (rgbValues) {
        const hex = "#" + [rgbValues[1], rgbValues[2], rgbValues[3]]
          .map(v => parseInt(v).toString(16).padStart(2, "0"))
          .join("");
        lines.push(`  --${name}: rgb(${value}) = ${hex}`);
      } else {
        lines.push(`  --${name}: ${value}`);
      }
    }
  }

  lines.push("");
  lines.push("CSS class meanings (from the framework):");
  lines.push("  bg-primary = background uses --color-sf-primary (brand red)");
  lines.push("  color-on-primary = text color for primary background (white)");
  lines.push("  bg-secondary = background uses --color-sf-secondary");
  lines.push("  color-primary = text color uses --color-sf-primary");
  lines.push("  color-tertiary = text color uses --color-sf-tertiary");
  lines.push("  bg-light-grey = light grey background");
  lines.push("  bg-white = white background");
  lines.push("  flex-row = horizontal flex layout, flex-col = vertical flex layout");
  lines.push("  md:w-4 = ~33% width column, md:w-8 = ~67% width column, md:w-6 = 50%");
  lines.push("  row = 12-column grid row, pad-md/pad-lg = medium/large padding");
  lines.push("  card = elevated card container, border-radius-lg = rounded corners");
  lines.push("  font-weight-7 = bold, font-weight-2 = light");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// HTML cleaning — strip framework noise so the LLM gets meaningful structure.
// Handles Angular (lib-*, app-*), React, and generic SPA output.
// ---------------------------------------------------------------------------

function cleanHtmlForLLM(rawHtml: string): { cleanedHtml: string; colorContext: string; imageAssets: string[] } {
  const colorContext = extractCssColorContext(rawHtml);

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

  // Collect image asset paths/URLs before any further processing
  const imageAssets: string[] = [];
  const imgRegex = /src\s*=\s*["']([^"']+\.(?:png|jpe?g|webp|gif))[^"']*["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const src = imgMatch[1].replace(/^\.\//, "");
    if (!imageAssets.includes(src)) imageAssets.push(src);
  }

  // --- Angular / Moveware framework cleanup ---

  // Strip Angular attributes: _ngcontent-*, _nghost-*, ng-version, ng-reflect-*
  html = html.replace(/\s+(?:_ngcontent|_nghost|ng-version|ng-reflect)[a-z0-9-]*(?:\s*=\s*"[^"]*")?/gi, "");

  // Unwrap Angular framework container elements — keep their CSS classes as
  // data attributes on a standard div so the LLM knows the layout intent.
  // lib-dynamic-container → div, lib-plain-html → (unwrap completely)
  html = html.replace(/<lib-dynamic-container([^>]*)>/gi, '<div$1>');
  html = html.replace(/<\/lib-dynamic-container>/gi, '</div>');

  // lib-plain-html wraps a single <div> — unwrap the outer tag
  html = html.replace(/<lib-plain-html[^>]*>\s*/gi, "");
  html = html.replace(/\s*<\/lib-plain-html>/gi, "");

  // lib-image → keep as div with image role
  html = html.replace(/<lib-image([^>]*)>/gi, '<div$1>');
  html = html.replace(/<\/lib-image>/gi, '</div>');

  // Unwrap app-root, app-rms, router-outlet
  html = html.replace(/<(?:app-root|app-rms|router-outlet)[^>]*>\s*/gi, "");
  html = html.replace(/<\/(?:app-root|app-rms)>/gi, "");

  // Unwrap <form> tags (these are Angular reactive forms, not real forms for us)
  html = html.replace(/<form[^>]*>\s*/gi, "");
  html = html.replace(/<\/form>/gi, "");

  // Remove empty divs and containers
  html = html.replace(/<div[^>]*>\s*<\/div>/gi, "");

  // Remove elements with "e-hidden" class (Angular hidden overlays/modals)
  html = html.replace(/<div[^>]*class="[^"]*e-hidden[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");

  // Remove id attributes (UUIDs that are just noise)
  html = html.replace(/\s+id="[0-9a-f]{8}-[0-9a-f-]+"/gi, "");

  // Remove "novalidate" and Angular form attributes
  html = html.replace(/\s+(?:novalidate|ng-untouched|ng-pristine|ng-valid|ng-invalid)/gi, "");

  // Clean up extra whitespace
  html = html.replace(/\n\s*\n\s*\n/g, "\n");
  html = html.replace(/[ \t]{3,}/g, " ");
  html = html.replace(/>\s+</g, ">\n<");

  return { cleanedHtml: html.trim(), colorContext, imageAssets };
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
              const { cleanedHtml, colorContext, imageAssets } = cleanHtmlForLLM(rawHtml);
              effectiveReferenceFileContent = colorContext
                ? `${colorContext}\n\n---\n\nCleaned HTML structure:\n${cleanedHtml}`
                : cleanedHtml;
              if (imageAssets.length > 0) {
                effectiveReferenceFileContent += `\n\nImage assets found: ${imageAssets.join(", ")}`;
              }
              console.log(`[Generate] Loaded HTML reference (raw ${(rawHtml.length / 1024).toFixed(1)}KB → cleaned ${(cleanedHtml.length / 1024).toFixed(1)}KB, colors: ${colorContext ? "yes" : "no"})`);
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
              const { cleanedHtml, colorContext, imageAssets } = cleanHtmlForLLM(rawHtml);

              // Also list image assets from the ZIP itself
              const zipImages = listZipImageAssets(zip);
              const allImages = [...new Set([...imageAssets, ...zipImages])];

              effectiveReferenceFileContent = colorContext
                ? `${colorContext}\n\n---\n\nCleaned HTML structure:\n${cleanedHtml}`
                : cleanedHtml;
              if (allImages.length > 0) {
                effectiveReferenceFileContent += `\n\nImage assets in ZIP (these are page content assets like banners/logos, NOT layout screenshots): ${allImages.join(", ")}`;
              }

              console.log(
                `[Generate] Loaded HTML from ZIP (${preferred.name}, raw ${(rawHtml.length / 1024).toFixed(1)}KB → cleaned ${(cleanedHtml.length / 1024).toFixed(1)}KB, colors: ${colorContext ? "yes" : "no"}, images: ${allImages.length})`,
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
