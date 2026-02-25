/**
 * Quote Acceptance API
 * POST /api/quotes/accept
 *
 * 1. Saves the acceptance record to the local database.
 * 2. Writes the acceptance back to Moveware via two calls (non-blocking — a
 *    Moveware failure never blocks the customer's confirmation):
 *      a. PATCH /jobs/{jobId}/quotes/{quoteId}  — status, options, signature
 *      b. POST  /jobs/{jobId}/activities        — diary entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getMwCredentials,
  patchMwQuoteAcceptance,
  postMwJobActivity,
} from '@/lib/services/moveware-api';

/** Build the "Accepted Option(s):" block used in the activity diary note. */
function buildOptionsSummary(selectedCosting: AcceptedCosting | null): string {
  if (!selectedCosting) return '';

  const lines: string[] = [`Accepted Option(s):`, selectedCosting.name || 'Unknown option'];

  const charges = selectedCosting.charges || [];
  const included = charges.filter((c) => c.included);
  if (included.length > 0) {
    lines.push('Included:');
    for (const c of included) {
      lines.push(` ${c.heading}: ${c.price.toFixed(2)} ${c.currency}`);
    }
  }

  return lines.join('\n');
}

/** Minimal shape of the charge data sent from the quote page. */
interface AcceptedCharge {
  id: number;
  heading: string;
  price: number;
  currency: string;
  included: boolean;
}

/** Minimal shape of the costing option sent from the quote page. */
interface AcceptedCosting {
  id: string;
  name?: string;
  totalPrice?: number;
  currency?: string;
  currencySymbol?: string;
  charges?: AcceptedCharge[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const quoteNumber: string       = body.quoteNumber || body.jobId || '';
    const jobId: string             = body.jobId || '';
    const coId: string              = body.coId || '';
    const quoteId: string           = body.quoteId || '';
    const signatureData: string     = body.signatureData || '';
    const signatureName: string     = body.signatureName || body.customerName || 'Accepted';
    const agreedToTerms: boolean    = !!body.agreedToTerms;
    const reloFromDate: string      = body.reloFromDate || '';
    const insuredValue: string      = body.insuredValue || '';
    const purchaseOrderNumber: string = body.purchaseOrderNumber || '';
    const specialRequirements: string = body.specialRequirements || '';
    const branchCode: string        = body.branchCode || '';
    const selectedCosting: AcceptedCosting | null = body.selectedCosting || null;

    console.log('📝 Received quote acceptance request:', { quoteNumber, signatureName, quoteId });

    // ── Validation ─────────────────────────────────────────────────────────
    if (!quoteNumber || !signatureData) {
      const missing = [
        !quoteNumber   && 'quoteNumber / jobId',
        !signatureData && 'signatureData',
      ].filter(Boolean).join(', ');
      console.error('❌ Validation failed: Missing required fields:', missing);
      return NextResponse.json(
        { error: `Missing required fields: ${missing}` },
        { status: 400 },
      );
    }

    if (!agreedToTerms) {
      console.error('❌ Validation failed: Terms not agreed');
      return NextResponse.json(
        { error: 'You must agree to the terms and conditions' },
        { status: 400 },
      );
    }

    // ── 1. Save to local database ───────────────────────────────────────────
    console.log('💾 Updating quote in database...');
    const updatedQuote = await prisma.quote.update({
      where: { quoteNumber },
      data: {
        status:       'accepted',
        termsAccepted: true,
        acceptedAt:   new Date(),
        acceptedBy:   signatureName,
        signatureData,
      },
    });
    console.log('✅ Quote acceptance saved locally:', updatedQuote.id);

    // ── 2. Write back to Moveware (non-blocking) ────────────────────────────
    // Both calls are attempted in parallel.  Failures are logged but do not
    // surface an error to the customer — the local acceptance is already saved.
    if (coId && quoteId && jobId) {
      const acceptedAt = new Date();
      const creds = await getMwCredentials(coId).catch(() => null);

      if (creds) {
        const selectedOptionIds: number[] = selectedCosting?.id
          ? [Number(selectedCosting.id)]
          : [];

        const optionsSummary = buildOptionsSummary(selectedCosting);

        const [patchResult, activityResult] = await Promise.allSettled([
          patchMwQuoteAcceptance(creds, jobId, quoteId, {
            signatureDate:  reloFromDate || acceptedAt.toLocaleDateString('en-AU'),
            signatureName,
            signatureImage: signatureData,
            accepted:       true,
            termsAndConditions: agreedToTerms,
            comments:       specialRequirements,
            selectedOptionIds,
          }),
          postMwJobActivity(creds, jobId, {
            jobId,
            branchCode,
            acceptedAt,
            agreedToTerms,
            signedOnline:   true,
            loadDate:       reloFromDate,
            insuredValue,
            purchaseOrderNumber,
            specialRequirements,
            acceptedOptionsSummary: optionsSummary,
          }),
        ]);

        if (patchResult.status === 'rejected') {
          console.error('[accept] Moveware PATCH failed (non-blocking):', patchResult.reason);
        } else {
          console.log('[accept] Moveware PATCH succeeded');
        }

        if (activityResult.status === 'rejected') {
          console.error('[accept] Moveware activity POST failed (non-blocking):', activityResult.reason);
        } else {
          console.log('[accept] Moveware activity diary created');
        }
      } else {
        console.warn('[accept] No Moveware credentials found for coId:', coId, '— skipping write-back');
      }
    } else {
      console.warn('[accept] Missing coId/quoteId/jobId — skipping Moveware write-back');
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedQuote,
        message: 'Quote accepted successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ Error accepting quote:', error);
    return NextResponse.json(
      {
        error: 'Failed to accept quote',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
