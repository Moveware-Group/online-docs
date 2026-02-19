/**
 * GET /api/debug/mw-raw?jobId=xxx&coId=yyy
 *
 * Returns the raw (un-adapted) Moveware API responses for a given job so you
 * can inspect the actual field names and fix the adapter mappings.
 *
 * Remove or restrict this endpoint once mappings are confirmed correct.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMwCredentials,
  fetchMwQuotation,
  fetchMwOptions,
  fetchMwInventory,
} from '@/lib/services/moveware-api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');
  const coId  = searchParams.get('coId');

  if (!jobId || !coId) {
    return NextResponse.json(
      { error: 'jobId and coId query params are required' },
      { status: 400 },
    );
  }

  const creds = await getMwCredentials(coId);
  if (!creds) {
    return NextResponse.json(
      { error: `No Moveware API credentials found for coId=${coId}. Configure them in Settings → Companies → API Credentials.` },
      { status: 404 },
    );
  }

  const results: Record<string, unknown> = {
    coId,
    jobId,
    baseUrl: creds.baseUrl,
  };

  // Fetch all three endpoints and capture raw responses + any errors
  await Promise.allSettled([
    fetchMwQuotation(creds, jobId).then(
      (data) => { results.quotation = data; },
      (err)  => { results.quotationError = String(err); },
    ),
    fetchMwOptions(creds, jobId).then(
      (data) => { results.options = data; },
      (err)  => { results.optionsError = String(err); },
    ),
    fetchMwInventory(creds, jobId).then(
      (data) => { results.inventory = data; },
      (err)  => { results.inventoryError = String(err); },
    ),
  ]);

  return NextResponse.json(results, { status: 200 });
}
