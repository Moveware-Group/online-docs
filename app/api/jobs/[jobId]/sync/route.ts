/**
 * Job Sync API
 * POST /api/jobs/[jobId]/sync?coId=<companyId>
 *
 * Syncs job data from the Moveware API.
 * Currently a placeholder that returns success — mock data is static.
 * TODO: Replace with live Moveware API integration once available.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 },
      );
    }

    // TODO: Once the Moveware API is connected, this route will:
    // 1. Fetch latest data from Moveware using createMovewareClient(coId)
    // 2. Update the local database with fresh data
    // 3. Return the updated records

    console.log(
      `[Sync] Job ${jobId} sync requested (mock mode — no external API call)`,
    );

    return NextResponse.json({
      success: true,
      message: `Job ${jobId} is up to date (mock data mode).`,
      source: "mock",
    });
  } catch (error) {
    console.error("Error syncing job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to sync job data" },
      { status: 500 },
    );
  }
}
