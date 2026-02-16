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

      // Read and encode reference file if provided
      let referenceFileData = null;
      if (referenceFilePath) {
        try {
          const filePath = path.join(process.cwd(), "public", referenceFilePath.replace(/^\//, ""));
          console.log(`[Generate] Attempting to read reference file: ${filePath}`);
          
          if (existsSync(filePath)) {
            const fileBuffer = await readFile(filePath);
            const base64 = fileBuffer.toString("base64");
            const ext = path.extname(filePath).toLowerCase();
            
            let mediaType = "application/pdf";
            if (ext === ".png") mediaType = "image/png";
            else if (ext === ".jpg" || ext === ".jpeg") mediaType = "image/jpeg";
            else if (ext === ".webp") mediaType = "image/webp";
            
            referenceFileData = {
              data: base64,
              mediaType,
              filename: path.basename(filePath),
            };
            console.log(`[Generate] Successfully encoded reference file (${mediaType}, ${(base64.length / 1024).toFixed(2)}KB)`);
          } else {
            console.warn(`[Generate] Reference file not found: ${filePath}`);
          }
        } catch (error) {
          console.error("[Generate] Error reading reference file:", error);
        }
      }

      const layoutConfig = await generateLayout({
        companyName,
        brandCode: brandCode || "",
        primaryColor: primaryColor || "#2563eb",
        secondaryColor: secondaryColor || "#1e40af",
        tertiaryColor,
        logoUrl,
        referenceUrl,
        referenceFileData,
        referenceFileContent,
        description,
        conversationHistory,
      });

      return NextResponse.json({
        success: true,
        data: layoutConfig,
        message: "Layout generated successfully. Review the preview and provide feedback to refine it.",
      });
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

      return NextResponse.json({
        success: true,
        data: layoutConfig,
        message: "Layout updated based on your feedback.",
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
