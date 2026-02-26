/**
 * Quote Acceptance API
 * POST /api/quotes/accept
 *
 * 1. Writes the acceptance back to Moveware via PATCH
 *    /jobs/{jobId}/quotations/{quoteId}  — status, options, charges, signature.
 * 2. Posts a diary activity entry: POST /jobs/{jobId}/activities.
 * 3. Attempts a best-effort local DB upsert (non-blocking — DB failure never
 *    prevents the customer's confirmation from reaching Moveware).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getMwCredentials,
  patchMwQuoteAcceptance,
  postMwJobActivity,
  type MwQuoteAcceptanceCharge,
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
  quantity?: number;
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

/** Parse DD/MM/YYYY or any date string → ISO 8601. Falls back to now. */
function toIso(dateStr: string): string {
  if (!dateStr) return new Date().toISOString();
  // Handle DD/MM/YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmyMatch) {
    return new Date(`${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`).toISOString();
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const quoteNumber: string         = body.quoteNumber || body.jobId || '';
    const jobId: string               = body.jobId || '';
    const coId: string                = body.coId || '';
    const quoteId: string             = body.quoteId || '';
    const signatureData: string       = body.signatureData || '';
    const signatureName: string       = body.signatureName || body.customerName || 'Accepted';
    const agreedToTerms: boolean      = !!body.agreedToTerms;
    const reloFromDate: string        = body.reloFromDate || '';
    const insuredValue: string        = body.insuredValue || '';
    const purchaseOrderNumber: string = body.purchaseOrderNumber || '';
    const specialRequirements: string = body.specialRequirements || '';
    const branchCode: string          = body.branchCode || '';
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

    // ── 1. Write back to Moveware ───────────────────────────────────────────
    // This is the primary acceptance path.  Failures are logged but a failed
    // Moveware call does NOT block the customer — the local record is still
    // saved and the confirmation page is shown.
    const acceptedAt = new Date();

    if (coId && quoteId && jobId) {
      const creds = await getMwCredentials(coId).catch(() => null);

      if (creds) {
        // Map the selected option's charges to the Moveware payload format
        const mwCharges: MwQuoteAcceptanceCharge[] = (selectedCosting?.charges ?? []).map((c) => ({
          id:          c.id,
          description: c.heading,
          value:       c.price,
          valueInc:    c.price,
          valueEx:     c.price,
          quantity:    String(c.quantity ?? 1),
          included:    c.included,
        }));

        const insuredValueNum = insuredValue
          ? parseFloat(insuredValue.replace(/[^0-9.]/g, '')) || 0
          : 0;

        const optionsSummary = buildOptionsSummary(selectedCosting);

        const [patchResult, activityResult] = await Promise.allSettled([
          patchMwQuoteAcceptance(creds, jobId, quoteId, {
            signatureDate:     acceptedAt.toISOString(),
            signatureName,
            signatureImage:    signatureData,
            accepted:          true,
            termsAndConditions: agreedToTerms,
            comments:          specialRequirements,
            jobOrder:          purchaseOrderNumber || undefined,
            estimatedMove:     reloFromDate ? toIso(reloFromDate) : undefined,
            insuredValue:      insuredValueNum || undefined,
            selectedOptions:   selectedCosting
              ? [{ id: selectedCosting.id, charges: mwCharges }]
              : [],
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
          console.error('[accept] Moveware PATCH failed:', patchResult.reason);
        } else {
          console.log('[accept] Moveware PATCH succeeded');
        }

        if (activityResult.status === 'rejected') {
          console.error('[accept] Moveware activity POST failed:', activityResult.reason);
        } else {
          console.log('[accept] Moveware activity diary created');
        }
      } else {
        console.warn('[accept] No Moveware credentials found for coId:', coId, '— skipping write-back');
      }
    } else {
      console.warn('[accept] Missing coId/quoteId/jobId — skipping Moveware write-back');
    }

    // ── 2. Best-effort local DB upsert (non-blocking) ──────────────────────
    // The Quote table requires companyId (FK) so we look it up first.
    // A failure here never blocks the customer's confirmation.
    let localId = `mw-${jobId}-${Date.now()}`;
    try {
      const company = coId
        ? await prisma.company.findFirst({ where: { tenantId: coId }, select: { id: true } })
        : null;

      if (company) {
        const localRecord = await (prisma.quote as unknown as {
          upsert: (args: unknown) => Promise<{ id: string }>;
        }).upsert({
          where:  { quoteNumber },
          create: {
            quoteNumber,
            companyId:     company.id,
            customerName:  signatureName,
            status:        'accepted',
            totalAmount:   selectedCosting?.totalPrice ?? 0,
            termsAccepted: true,
            acceptedAt,
            acceptedBy:    signatureName,
            signatureData,
            data:          JSON.stringify({ jobId, quoteId }),
          },
          update: {
            status:        'accepted',
            termsAccepted: true,
            acceptedAt,
            acceptedBy:    signatureName,
            signatureData,
          },
        });
        localId = localRecord.id;
        console.log('✅ Local DB record upserted:', localId);
      } else {
        console.warn('[accept] Company not found for coId:', coId, '— skipping local DB save');
      }
    } catch (dbErr) {
      console.warn('[accept] Local DB upsert failed (non-blocking):', dbErr);
    }

    return NextResponse.json(
      {
        success: true,
        data:    { id: localId },
        message: 'Quote accepted successfully',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('❌ Error accepting quote:', error);
    return NextResponse.json(
      {
        error:   'Failed to accept quote',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
