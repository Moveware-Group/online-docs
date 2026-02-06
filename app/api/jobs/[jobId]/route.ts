import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/services/jobService';
import { createMovewareClient } from '@/lib/clients/moveware';
import { transformJobForDatabase } from '@/lib/types/job';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Extract company ID from URL parameter
    const { searchParams } = new URL(request.url);
    const coIdParam = searchParams.get('coId');

    // Validate jobId parameter
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Validate and parse company ID as integer
    if (!coIdParam) {
      return NextResponse.json(
        { error: 'Company ID (coId) parameter is required' },
        { status: 400 }
      );
    }

    const companyId = parseInt(coIdParam);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'Company ID (coId) must be a valid integer' },
        { status: 400 }
      );
    }

    // Try to fetch job from database first
    let job = await jobService.getJob(jobId);

    // If not in database, fetch from Moveware API and save
    if (!job) {
      console.log(`Job ${jobId} not found in database. Fetching from Moveware API (Company ID: ${companyId})...`);
      
      try {
        // Create client with dynamic company ID (integer)
        const movewareClient = createMovewareClient(companyId);
        
        // Fetch from Moveware API
        const movewareJob = await movewareClient.get<any>(`/jobs/${jobId}`);
        
        if (!movewareJob) {
          return NextResponse.json(
            { error: 'Job not found in Moveware API' },
            { status: 404 }
          );
        }

        // Transform and save to database
        const jobData = transformJobForDatabase(movewareJob);
        job = await jobService.upsertJob(jobData);
        
        console.log(`✓ Job ${jobId} saved to database`);
      } catch (apiError) {
        console.error(`Error fetching from Moveware API:`, apiError);
        return NextResponse.json(
          { error: 'Job not found in database or Moveware API' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: job
      },
      { status: 200 }
    );
  } catch (error) {
    const awaitedParams = await params;
    console.error(`Error fetching job details for job ${awaitedParams.jobId}:`, error);

    return NextResponse.json(
      { error: 'Failed to fetch job details' },
      { status: 500 }
    );
  }
}
