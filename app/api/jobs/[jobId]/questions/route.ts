import { NextRequest, NextResponse } from 'next/server';
import { createMovewareClient } from '@/lib/clients/moveware';
import { PerformanceReviewApiResponse, Question } from '@/lib/types/performance';

/**
 * Transform Moveware API question data to our format
 */
function transformQuestion(apiQuestion: any): Question {
  return {
    id: apiQuestion.id || apiQuestion.questionId,
    type: apiQuestion.type || apiQuestion.questionType,
    text: apiQuestion.text || apiQuestion.question,
    required: apiQuestion.required ?? false,
    options: apiQuestion.options?.map((opt: any) => ({
      id: opt.id || opt.value,
      label: opt.label || opt.text,
      value: opt.value,
    })),
    maxRating: apiQuestion.maxRating || apiQuestion.scale || 5,
    placeholder: apiQuestion.placeholder || 'Enter your comments...',
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Extract parameters from URL
    const { searchParams } = new URL(request.url);
    const coIdParam = searchParams.get('coId');
    const testMode = searchParams.get('test') === 'true';

    // Validate jobId parameter
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Validate and parse company ID as integer
    if (!coIdParam) {
      return NextResponse.json(
        { success: false, error: 'Company ID (coId) parameter is required' },
        { status: 400 }
      );
    }

    const companyId = parseInt(coIdParam);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: 'Company ID (coId) must be a valid integer' },
        { status: 400 }
      );
    }

    // Create Moveware client with dynamic company ID
    const movewareClient = createMovewareClient(companyId);

    try {
      // Fetch questions from Moveware API
      const apiResponse = await movewareClient.get<any>(`/jobs/${jobId}/questions`);

      if (!apiResponse) {
        return NextResponse.json(
          { success: false, error: 'No questions found for this job' },
          { status: 404 }
        );
      }

      // Transform questions
      const questions: Question[] = Array.isArray(apiResponse.questions)
        ? apiResponse.questions.map(transformQuestion)
        : [];

      const response: PerformanceReviewApiResponse = {
        success: true,
        data: {
          id: apiResponse.id || `review-${jobId}`,
          jobId: parseInt(jobId),
          title: apiResponse.title || 'Performance Review',
          description: apiResponse.description,
          questions,
          status: 'draft',
          createdAt: apiResponse.createdAt || new Date().toISOString(),
          updatedAt: apiResponse.updatedAt || new Date().toISOString(),
        },
      };

      return NextResponse.json(response);
    } catch (apiError) {
      console.error(`Error fetching questions from Moveware API:`, apiError);
      
      // If test mode is enabled, return mock data for development/testing
      if (testMode) {
        console.warn(`⚠️ Returning MOCK data due to test=true parameter for job ${jobId}`);
        
        const mockResponse: PerformanceReviewApiResponse = {
          success: true,
          data: {
            id: `review-${jobId}`,
            jobId: parseInt(jobId),
            title: 'Move Performance Review (TEST MODE)',
            description: '⚠️ This is mock data for testing purposes',
            questions: [
              {
                id: 'q1',
                type: 'rating',
                text: 'How would you rate the overall quality of service?',
                required: true,
                maxRating: 5,
              },
              {
                id: 'q2',
                type: 'rating',
                text: 'How professional was the moving team?',
                required: true,
                maxRating: 5,
              },
              {
                id: 'q3',
                type: 'yesno',
                text: 'Were all items handled with care?',
                required: true,
              },
              {
                id: 'q4',
                type: 'yesno',
                text: 'Did the move complete on time?',
                required: true,
              },
              {
                id: 'q5',
                type: 'radio',
                text: 'How would you describe the communication during the move?',
                required: true,
                options: [
                  { id: 'opt1', label: 'Excellent', value: 'excellent' },
                  { id: 'opt2', label: 'Good', value: 'good' },
                  { id: 'opt3', label: 'Fair', value: 'fair' },
                  { id: 'opt4', label: 'Poor', value: 'poor' },
                ],
              },
              {
                id: 'q6',
                type: 'checkbox',
                text: 'Which aspects of the service were you most satisfied with? (Select all that apply)',
                required: false,
                options: [
                  { id: 'opt1', label: 'Punctuality', value: 'punctuality' },
                  { id: 'opt2', label: 'Care of items', value: 'care' },
                  { id: 'opt3', label: 'Professionalism', value: 'professionalism' },
                  { id: 'opt4', label: 'Communication', value: 'communication' },
                  { id: 'opt5', label: 'Value for money', value: 'value' },
                ],
              },
              {
                id: 'q7',
                type: 'comment',
                text: 'Please provide any additional comments or suggestions',
                required: false,
                placeholder: 'Share your thoughts, concerns, or suggestions...',
              },
            ],
            status: 'draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };

        return NextResponse.json(mockResponse);
      }
      
      // Return proper error response for production
      // This ensures API failures are visible and don't result in incorrect data submission
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch performance review questions from the API. Please try again later.',
        },
        { status: 503 } // Service Unavailable - indicates upstream service failure
      );
    }
  } catch (error) {
    const awaitedParams = await params;
    console.error(`Error fetching questions for job ${awaitedParams.jobId}:`, error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch performance review questions',
      },
      { status: 500 }
    );
  }
}
