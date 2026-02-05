import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

    const jobIdInt = parseInt(jobId);

    // Fetch costings from database
    const costings = await prisma.costingItem.findMany({
      where: {
        jobId: jobIdInt,
      },
      orderBy: {
        createdAt: 'asc',
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
