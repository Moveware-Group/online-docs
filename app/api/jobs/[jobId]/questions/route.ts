/**
 * GET /api/jobs/[jobId]/questions?coId=<tenantId>
 * Proxies GET /{{coId}}/api/jobs/{{jobId}}/questions from Moveware and
 * normalises the response so the client always receives a consistent shape.
 *
 * Moveware quirks handled here:
 *  - Response is wrapped in { "questions": [...] } not a bare array
 *  - `responses` is a comma-separated string, not an array
 *  - `controlType` uses mixed/inconsistent casing ("Heading", "Radio", "Y", …)
 *  - `showEditor` uses "Yes"/"No" not "Y"/"N"
 *  - `conditionalParent` / `conditionalAnswer` may be empty strings instead of null
 *  - `sort` is a zero-padded string ("001", "010") — preserved as-is for lexicographic sort
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMwCredentials, fetchMwQuestions } from '@/lib/services/moveware-api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawQuestion = Record<string, any>;

/** Map Moveware's free-form controlType to the values our renderer understands. */
function normaliseControlType(ct: string): string {
  switch ((ct ?? '').toLowerCase().trim()) {
    case 'heading':       return 'heading';
    case 'radio':         return 'radio';
    case 'checkbox':      return 'checkbox';
    case 'combo':         return 'Combo';
    case 'valuation':     return 'Valuation';
    case 'signature':     return 'Signature';
    case 'image feedback':return 'image feedback';
    case 'rating':        return 'rating';
    // "Y" appears in Moveware data as a catch-all radio/select type
    case 'y':             return 'radio';
    // Empty controlType but with responses → treat as radio
    default:              return 'radio';
  }
}

function normaliseQuestion(q: RawQuestion) {
  // Parse comma-separated responses string → string[]
  const responses: string[] =
    typeof q.responses === 'string'
      ? q.responses.split(',').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(q.responses)
      ? q.responses
      : [];

  // Normalise showEditor: treat "Y", "Yes", "y", "yes" as 'Y', everything else as 'N'
  const showEditorRaw = String(q.showEditor ?? '').toLowerCase().trim();
  const showEditor: 'Y' | 'N' = showEditorRaw === 'y' || showEditorRaw === 'yes' ? 'Y' : 'N';

  return {
    id:                q.id,
    question:          q.question ?? '',
    controlType:       normaliseControlType(q.controlType),
    responses,
    showEditor,
    sort:              q.sort ?? '',
    type:              q.type ?? '',
    conditionalParent: q.conditionalParent || null,
    conditionalAnswer: q.conditionalAnswer || null,
    // Pass through any other fields the client might need
    optional:          q.optional ?? '',
    value:             q.value ?? null,
    answer:            q.answer ?? null,
  };
}

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

    if (!coId) {
      return NextResponse.json({ success: false, error: 'coId is required' }, { status: 400 });
    }

    const creds = await getMwCredentials(coId);
    if (!creds) {
      console.warn(`[questions/route] No Moveware credentials found for coId=${coId}`);
      return NextResponse.json(
        { success: false, error: `No credentials configured for coId: ${coId}` },
        { status: 404 },
      );
    }

    const raw = await fetchMwQuestions(creds, jobId);

    // Extract the questions array — Moveware wraps it in { questions: [...] }
    // but guard against plain arrays or other wrappers for forward-compatibility.
    const rawList: RawQuestion[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as RawQuestion)?.questions)
      ? (raw as RawQuestion).questions
      : Array.isArray((raw as RawQuestion)?.results)
      ? (raw as RawQuestion).results
      : Array.isArray((raw as RawQuestion)?.data)
      ? (raw as RawQuestion).data
      : [];

    console.log(`[questions/route] job=${jobId} coId=${coId} — ${rawList.length} questions extracted`);

    const questions = rawList.map(normaliseQuestion);

    return NextResponse.json({ success: true, data: questions, source: 'moveware' });
  } catch (error) {
    console.error('[questions/route] Error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
