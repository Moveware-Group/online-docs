/**
 * Debug endpoint to test URL capture and see what screenshot is generated
 * GET /api/layouts/debug-capture?url=<encoded-url>
 */

import { NextRequest, NextResponse } from "next/server";
import { captureUrl } from "@/lib/services/browser-service";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "url parameter is required" },
        { status: 400 },
      );
    }

    console.log(`[Debug Capture] Capturing URL: ${url}`);

    const { screenshot, html, error } = await captureUrl(url);

    if (error) {
      return NextResponse.json({
        success: false,
        error,
      });
    }

    if (!screenshot) {
      return NextResponse.json({
        success: false,
        error: "Failed to capture screenshot",
      });
    }

    // Return the screenshot as base64 data URL
    const base64 = screenshot.toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return NextResponse.json({
      success: true,
      screenshotSize: screenshot.length,
      screenshotSizeKB: (screenshot.length / 1024).toFixed(2),
      htmlSize: html?.length || 0,
      htmlSizeKB: ((html?.length || 0) / 1024).toFixed(2),
      screenshotDataUrl: dataUrl,
      htmlPreview: html?.substring(0, 2000),
    });
  } catch (error) {
    console.error("[Debug Capture] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
