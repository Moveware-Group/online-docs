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

            // For HTML references, pass raw HTML content directly into prompt context.
            // This gives the model exact DOM structure to map placeholders against.
            if (mediaType === "text/html") {
              const htmlText = fileBuffer.toString("utf-8");
              effectiveReferenceFileContent = htmlText;
              console.log(`[Generate] Loaded HTML reference (${(htmlText.length / 1024).toFixed(2)}KB text)`);
            } else if (mediaType === "application/zip") {
              // Extract HTML from a "Save page complete" style ZIP bundle
              const zip = await JSZip.loadAsync(fileBuffer);
              const htmlCandidates = Object.values(zip.files).filter(
                (entry) => !entry.dir && /\.(html?|xhtml)$/i.test(entry.name),
              );

              if (htmlCandidates.length === 0) {
                throw new Error("ZIP file contains no HTML files");
              }

              // Prefer index/home-like names, otherwise the first HTML file
              const preferred =
                htmlCandidates.find((e) => /index|quote|home/i.test(e.name)) ||
                htmlCandidates[0];

              const htmlText = await preferred.async("string");
              effectiveReferenceFileContent = htmlText;
              console.log(
                `[Generate] Loaded HTML from ZIP (${preferred.name}, ${(htmlText.length / 1024).toFixed(2)}KB text)`,
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
