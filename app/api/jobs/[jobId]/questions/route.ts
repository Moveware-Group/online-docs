/**
 * GET /api/jobs/[jobId]/questions?coId=<tenantId>
 * Proxies GET /{{coId}}/api/jobs/{{jobId}}/questions from Moveware.
 * Returns survey/review questions with controlType, conditional logic, responses etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMwCredentials, fetchMwQuestions } from '@/lib/services/moveware-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const coId = new URL(request.url).searchParams.get('coId');

    if (!jobId) {
      return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
    }

    if (coId) {
      const creds = await getMwCredentials(coId);
      if (creds) {
        const raw = await fetchMwQuestions(creds, jobId);
        return NextResponse.json({ success: true, data: raw, source: 'moveware' });
      }
    }

    return NextResponse.json({ success: false, error: 'No credentials found for coId' }, { status: 404 });
  } catch (error) {
    console.error('[questions/route] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch questions' }, { status: 500 });
  }
}
