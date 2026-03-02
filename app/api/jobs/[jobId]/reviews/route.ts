/**
 * GET /api/jobs/[jobId]/reviews?coId=<tenantId>
 * Proxies GET /{{coId}}/api/jobs/{{jobId}}/reviews from Moveware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMwCredentials, fetchMwReviews } from '@/lib/services/moveware-api';

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
        const raw = await fetchMwReviews(creds, jobId);
        return NextResponse.json({ success: true, data: raw, source: 'moveware' });
      }
    }

    return NextResponse.json({ success: false, error: 'No credentials found for coId' }, { status: 404 });
  } catch (error) {
    console.error('[reviews/route] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
