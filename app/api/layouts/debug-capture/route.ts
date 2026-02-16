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
    console.log(`[Debug Capture] URL length: ${url.length} chars`);

    const startTime = Date.now();
    const { screenshot, html, error } = await captureUrl(url);
    const elapsed = Date.now() - startTime;

    console.log(`[Debug Capture] Completed in ${elapsed}ms`);

    if (error && !screenshot && !html) {
      return NextResponse.json({
        success: false,
        error,
        urlLength: url.length,
        elapsedMs: elapsed,
      });
    }

    const result: Record<string, unknown> = {
      success: true,
      urlLength: url.length,
      elapsedMs: elapsed,
      hasScreenshot: !!screenshot,
      hasHtml: !!html,
    };

    if (screenshot) {
      const base64 = screenshot.toString("base64");
      result.screenshotSize = screenshot.length;
      result.screenshotSizeKB = (screenshot.length / 1024).toFixed(2);
      result.screenshotDataUrl = `data:image/png;base64,${base64}`;
    }

    if (html) {
      result.htmlSize = html.length;
      result.htmlSizeKB = (html.length / 1024).toFixed(2);
      result.htmlPreview = html.substring(0, 3000);
    }

    if (error) {
      result.partialError = error;
    }

    return NextResponse.json(result);
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
