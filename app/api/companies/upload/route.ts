import { NextRequest, NextResponse } from "next/server";

/**
 * Legacy upload endpoint placeholder.
 * Clients should use /api/companies/[id]/logo for logo uploads.
 */
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        success: false,
        error:
          "This endpoint is deprecated. Use /api/companies/[id]/logo for logo uploads.",
      },
      { status: 410 },
    );
  } catch (error) {
    console.error("Error handling upload request:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process upload request" },
      { status: 500 },
    );
  }
}
