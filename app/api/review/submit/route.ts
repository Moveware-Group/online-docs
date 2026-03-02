import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getMwCredentials, postMwReview } from '@/lib/services/moveware-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobId, token, companyId, reviewTypes, answers } = body;

    if (!token || !answers) {
      return NextResponse.json(
        { error: 'Missing required fields: token and answers' },
        { status: 400 },
      );
    }

    // ── 1. Save locally ──────────────────────────────────────────────────────
    const submission = await prisma.reviewSubmission.create({
      data: {
        quoteId:   jobId ? String(jobId) : null,
        token,
        companyId: companyId ? String(companyId) : null,
        answers:   JSON.stringify(answers),
      },
    });

    console.log('[review/submit] Saved locally:', {
      submissionId: submission.id,
      jobId,
      answersCount: Array.isArray(answers) ? answers.length : Object.keys(answers).length,
      timestamp: submission.submittedAt.toISOString(),
    });

    // ── 2. Write back to Moveware (best effort) ──────────────────────────────
    let mwError: string | null = null;

    if (jobId && companyId) {
      try {
        const creds = await getMwCredentials(String(companyId));
        if (creds) {
          const mwPayload = {
            reviewTypes,
            answers,
            token,
            submittedAt: submission.submittedAt.toISOString(),
          };
          await postMwReview(creds, String(jobId), mwPayload);
          console.log('[review/submit] Moveware write-back succeeded for job', jobId);
        } else {
          console.warn('[review/submit] No Moveware credentials for coId', companyId);
        }
      } catch (err) {
        mwError = err instanceof Error ? err.message : String(err);
        console.error('[review/submit] Moveware write-back failed:', mwError);
        // Non-fatal — local save already succeeded
      }
    }

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      message: 'Review submitted successfully',
      ...(mwError ? { mwError } : {}),
    });
  } catch (error) {
    console.error('[review/submit] Error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
