/**
 * Test endpoint to debug reference URL fetching
 * GET /api/layouts/test-fetch?url=<encoded-url>
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "url parameter is required" },
        { status: 400 },
      );
    }

    console.log(`[Test Fetch] Attempting to fetch: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    console.log(`[Test Fetch] Response status: ${response.status} ${response.statusText}`);
    console.log(`[Test Fetch] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status} ${response.statusText}`,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      });
    }

    const html = await response.text();
    console.log(`[Test Fetch] Fetched ${html.length} characters`);

    // Return first 5000 chars for preview
    return NextResponse.json({
      success: true,
      contentLength: html.length,
      preview: html.substring(0, 5000),
      headers: Object.fromEntries(response.headers.entries()),
    });
  } catch (error) {
    console.error("[Test Fetch] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
