import { NextRequest, NextResponse } from 'next/server';
import { submitAcceptanceActivity, isMovewareConfigured } from '@/lib/services/movewareService';
import { MovewareActivityPayload, MovewareActivityResponse } from '@/lib/types/moveware';

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

/**
 * POST /api/jobs/[jobId]/activities
 * Submit an acceptance activity to Moveware
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<MovewareActivityResponse>> {
  try {
    // Check if Moveware API is configured
    if (!isMovewareConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Moveware API is not configured. Please check environment variables.',
        },
        { status: 503 }
      );
    }

    // Get jobId from route params
    const { jobId } = await context.params;

    if (!jobId || jobId.trim() === '') {
      return NextResponse.json(
        {
          success: false,
          error: 'Job ID is required',
        },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields in the payload
    if (!body.customerDetails?.name || !body.customerDetails?.email || !body.customerDetails?.phone) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required customer details: name, email, and phone are required',
        },
        { status: 400 }
      );
    }

    if (!body.serviceDetails?.serviceType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Service type is required',
        },
        { status: 400 }
      );
    }

    if (!body.acceptance?.signatureData || !body.acceptance?.typedName || !body.acceptance?.acceptedTerms) {
      return NextResponse.json(
        {
          success: false,
          error: 'Complete acceptance information is required (signature, typed name, and terms acceptance)',
        },
        { status: 400 }
      );
    }

    // Construct the activity payload
    const payload: MovewareActivityPayload = {
      activityType: 'acceptance',
      timestamp: new Date().toISOString(),
      customerDetails: {
        name: body.customerDetails.name.trim(),
        email: body.customerDetails.email.toLowerCase().trim(),
        phone: body.customerDetails.phone.trim(),
        address: body.customerDetails.address?.trim() || undefined,
      },
      serviceDetails: {
        serviceType: body.serviceDetails.serviceType,
        moveDate: body.serviceDetails.moveDate?.trim() || undefined,
        details: body.serviceDetails.details?.trim() || undefined,
      },
      acceptance: {
        signatureData: body.acceptance.signatureData,
        typedName: body.acceptance.typedName.trim(),
        acceptedTerms: body.acceptance.acceptedTerms,
        acceptedAt: body.acceptance.acceptedAt || new Date().toISOString(),
      },
      selectedOptions: body.selectedOptions || undefined,
      comments: body.comments?.trim() || undefined,
    };

    // Submit to Moveware API
    const result = await submitAcceptanceActivity(jobId, payload);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        activityId: result.activityId,
        jobId: jobId,
        timestamp: result.timestamp || payload.timestamp,
        message: result.message || 'Activity submitted successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting activity:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      // Check for network/API errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to connect to Moveware API. Please check your network connection.',
          },
          { status: 502 }
        );
      }

      // Return the error message
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred while submitting the activity',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/jobs/[jobId]/activities
 * Health check endpoint for this route
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const { jobId } = await context.params;

  return NextResponse.json(
    {
      endpoint: `/api/jobs/${jobId}/activities`,
      methods: ['POST'],
      configured: isMovewareConfigured(),
      message: 'Use POST to submit acceptance activities',
    },
    { status: 200 }
  );
}
