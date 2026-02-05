/**
 * Job Costings API Route
 * GET /api/jobs/:jobId/costings - Get costings for a specific job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJobCosting } from '@/lib/services/costingsService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const costing = await getJobCosting(jobId);

    if (!costing) {
      return NextResponse.json(
        { error: 'Job costing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ costing });
  } catch (error) {
    console.error('Error fetching job costing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job costing' },
      { status: 500 }
    );
  }
}
