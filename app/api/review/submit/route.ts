import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, token, brand, coId, answers } = body;

    // Validate required fields
    if (!jobId || !token || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: jobId, token, and answers' },
        { status: 400 }
      );
    }

    // Save the review submission to the database
    const submission = await prisma.reviewSubmission.create({
      data: {
        jobId: String(jobId),
        token,
        brand: brand || null,
        companyId: coId ? String(coId) : null,
        answers: JSON.stringify(answers),
      },
    });

    console.log('Performance review submitted successfully:', {
      submissionId: submission.id,
      jobId,
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
