import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate jobId parameter
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Get companyId from query params
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Fetch costings from database (costings are company-level, not job-specific)
    const costings = await prisma.costing.findMany({
      where: {
        companyId,
        isActive: true,
      },
      orderBy: {
        category: 'asc',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: costings
      },
      { status: 200 }
    );
  } catch (error) {
    const awaitedParams = await params;
    console.error(`Error fetching costings for job ${awaitedParams.jobId}:`, error);

    return NextResponse.json(
      { error: 'Failed to fetch job costings' },
      { status: 500 }
    );
  }
}
