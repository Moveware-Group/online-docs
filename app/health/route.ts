import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * GET /health
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
    },
    { status: 200 },
  );
}
