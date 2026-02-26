/**
 * Quotation Options API
 * GET /api/jobs/[jobId]/quotations/[quoteId]?coId=<companyTenantId>
 *
 * Proxies the new consolidated Moveware endpoint:
 *   GET https://rest.moveware.app/{coId}/api/jobs/{jobId}/quotations/{quoteId}?include=options
 *
 * This single call returns the quotation header plus all pricing options with
 * their charge line items, inclusions, and exclusions — replacing the
 * separate /options?include=charges call used by the legacy costings route.
 *
 * Falls back to mock data when credentials are absent or the upstream call fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMwCredentials,
  fetchMwQuotationOptions,
  adaptMwQuotationOptions,
  adaptMwQuotationMeasurements,
} from '@/lib/services/moveware-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string; quoteId: string }> },
) {
  try {
    const { jobId, quoteId } = await params;
    const coId = new URL(request.url).searchParams.get('coId');

    if (!jobId || !quoteId) {
      return NextResponse.json(
        { success: false, error: 'jobId and quoteId are required' },
        { status: 400 },
      );
    }

    // ── Live Moveware API path ───────────────────────────────────────────────
    if (coId) {
      const creds = await getMwCredentials(coId);
      if (creds) {
        try {
          const raw = await fetchMwQuotationOptions(creds, jobId, quoteId);
          const costings     = adaptMwQuotationOptions(raw);
          const measurements = adaptMwQuotationMeasurements(raw);

          return NextResponse.json({
            success: true,
            data: costings,
            measurements,
            count: costings.length,
            source: 'moveware',
          });
        } catch (err) {
          console.error(
            '[quotations/route] Moveware API failed, falling back to mock:',
            err,
          );
        }
      }
    }

    // ── Mock fallback ────────────────────────────────────────────────────────
    return NextResponse.json(
      {
        success: false,
        error: `No data found for job ${jobId} quotation ${quoteId}. Configure Moveware API credentials in Settings to load live data.`,
      },
      { status: 404 },
    );
  } catch (error) {
    console.error('Error fetching quotation options:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch quotation options' },
      { status: 500 },
    );
  }
}
