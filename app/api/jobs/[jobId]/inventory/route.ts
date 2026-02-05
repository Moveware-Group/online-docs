import { NextRequest, NextResponse } from 'next/server';
import { movewareClient } from '@/lib/clients/moveware';

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

    // Fetch inventory data from Moveware API
    const inventory = await movewareClient.get(`/jobs/${jobId}/inventory`);

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found for this job' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: inventory
      },
      { status: 200 }
    );
  } catch (error) {
    const awaitedParams = await params;
    console.error(`Error fetching inventory for job ${awaitedParams.jobId}:`, error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Inventory not found for this job' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized access to Moveware API' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch job inventory' },
      { status: 500 }
    );
  }
}
