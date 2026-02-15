import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { quoteId, token, companyId, answers } = body;

    // Validate required fields
    if (!token || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: token and answers' },
        { status: 400 }
      );
    }

    // Save the review submission to the database
    const submission = await prisma.reviewSubmission.create({
      data: {
        quoteId: quoteId ? String(quoteId) : null,
        token,
        companyId: companyId ? String(companyId) : null,
        answers: JSON.stringify(answers),
      },
    });

    console.log('Review submitted successfully:', {
      submissionId: submission.id,
      quoteId,
      answersCount: Object.keys(answers).length,
      timestamp: submission.submittedAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
