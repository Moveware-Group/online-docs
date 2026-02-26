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
  patchMwJobStatus,
  postMwJobActivity,
  type MwQuoteAcceptanceCharge,
} from '@/lib/services/moveware-api';

/** Format a price without redundant decimals: 1050 → "1050", 1050.5 → "1050.50" */
function fmtPrice(p: number): string {
  return p % 1 === 0 ? String(Math.round(p)) : p.toFixed(2);
}

/**
 * Build the full activity diary notes string.
 * Uses \r\n (Windows line endings) and plain ASCII "- " bullets for
 * maximum compatibility with the Moveware notes field.
 */
function buildNotes(opts: {
  agreedToTerms: boolean;
  purchaseOrderNumber: string;
  reloFromDate: string;
  insuredValue: string;
  specialRequirements: string;
  selectedCosting: AcceptedCosting | null;
  allCostings: AcceptedCosting[];
}): string {
  const CRLF  = '\n';
  const pad2  = (n: number) => String(n + 1).padStart(2, '0');
  const lines: string[] = [];

  // ── Header fields ────────────────────────────────────────────────────────
  lines.push(`Accepted Terms and Conditions: ${opts.agreedToTerms ? 'yes' : 'no'}`);
  lines.push(`Signed Online: Yes`);
  if (opts.purchaseOrderNumber) lines.push(`Order Number: ${opts.purchaseOrderNumber}`);
  if (opts.reloFromDate)        lines.push(`Load Date: ${opts.reloFromDate}`);
  if (opts.insuredValue)        lines.push(`Insurance Value: ${opts.insuredValue}`);
  if (opts.specialRequirements) lines.push(`Special Requirements: ${opts.specialRequirements}`);

  // ── Accepted option ──────────────────────────────────────────────────────
  if (opts.selectedCosting) {
    const idx = opts.allCostings.findIndex((c) => c.id === opts.selectedCosting!.id);
    lines.push('');
    lines.push('Accepted Option(s):');
    lines.push(`Option ${pad2(idx >= 0 ? idx : 0)} - ${opts.selectedCosting.name || 'Unknown option'}`);
    for (const c of opts.selectedCosting.charges || []) {
      lines.push(`\u2022 ${c.heading}: ${fmtPrice(c.price)} ${c.currency}`);
    }
  }

  // ── Declined options ─────────────────────────────────────────────────────
  const declined = opts.allCostings.filter((c) => c.id !== opts.selectedCosting?.id);
  if (declined.length > 0) {
    lines.push('');
    lines.push('Declined Option(s):');
    declined.forEach((opt, i) => {
      const globalIdx = opts.allCostings.findIndex((c) => c.id === opt.id);
      lines.push(`Option ${pad2(globalIdx >= 0 ? globalIdx : i)} - ${opt.name || 'Unknown option'}`);
      for (const c of opt.charges || []) {
        lines.push(`\u2022 ${c.heading}: ${fmtPrice(c.price)} ${c.currency}`);
      }
    });
  }

  return lines.join(CRLF);
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
    const allCostings: AcceptedCosting[]          = body.allCostings || [];

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
    const mwWritebackErrors: string[] = [];

    if (coId && jobId) {
      const creds = await getMwCredentials(coId).catch(() => null);

      if (creds) {
        const insuredValueNum = insuredValue
          ? parseFloat(insuredValue.replace(/[^0-9.]/g, '')) || 0
          : 0;

        const activityNotes = buildNotes({
          agreedToTerms,
          purchaseOrderNumber,
          reloFromDate,
          insuredValue,
          specialRequirements,
          selectedCosting,
          allCostings,
        });

        // ── Calls that only need coId + jobId ─────────────────────────────
        const basePromises: Promise<unknown>[] = [
          // NOTE: Auto-setting job status to W is disabled for now.
          // The client will manually update the job status once they have
          // confirmed the quote and move date.  Re-enable (or replace with a
          // per-company flag) when automatic "Won" marking is required.
          //
          // patchMwJobStatus(creds, jobId, {
          //   status:            'W',
          //   estimatedMoveDate: reloFromDate ? toIso(reloFromDate) : undefined,
          // }),
          postMwJobActivity(creds, jobId, {
            jobId,
            branchCode,
            acceptedAt,
            agreedToTerms,
            signedOnline:           true,
            loadDate:               reloFromDate,
            insuredValue,
            purchaseOrderNumber,
            specialRequirements,
            acceptedOptionsSummary: activityNotes,
          }),
        ];

        // ── Quotation PATCH also requires quoteId ────────────────────────
        if (quoteId) {
          const mwCharges: MwQuoteAcceptanceCharge[] = (selectedCosting?.charges ?? []).map((c) => ({
            id:          c.id,
            description: c.heading,
            value:       c.price,
            valueInc:    c.price,
            valueEx:     c.price,
            quantity:    String(c.quantity ?? 1),
            included:    c.included,
          }));

          basePromises.push(
            patchMwQuoteAcceptance(creds, jobId, quoteId, {
              signatureDate:      acceptedAt.toISOString(),
              signatureName,
              signatureImage:     signatureData,
              accepted:           true,
              termsAndConditions: agreedToTerms,
              comments:           specialRequirements,
              jobOrder:           purchaseOrderNumber || undefined,
              estimatedMove:      reloFromDate ? toIso(reloFromDate) : undefined,
              insuredValue:       insuredValueNum || undefined,
              selectedOptions:    selectedCosting
                ? [{ id: selectedCosting.id, charges: mwCharges }]
                : [],
            }),
          );
        } else {
          console.warn('[accept] No quoteId — skipping quotation PATCH (job status + activity will still be posted)');
        }

        const results = await Promise.allSettled(basePromises);

        const [activityResult, patchResult] = results;

        if (activityResult.status === 'rejected') {
          const msg = String((activityResult as PromiseRejectedResult).reason);
          console.error('[accept] Moveware activity POST failed:', msg);
          mwWritebackErrors.push(`Activity POST: ${msg}`);
        } else {
          console.log('[accept] Moveware activity diary created');
        }

        if (patchResult) {
          if (patchResult.status === 'rejected') {
            const msg = String((patchResult as PromiseRejectedResult).reason);
            console.error('[accept] Moveware quotation PATCH failed:', msg);
            mwWritebackErrors.push(`Quotation PATCH: ${msg}`);
          } else {
            console.log('[accept] Moveware quotation PATCH succeeded');
          }
        }
      } else {
        console.warn('[accept] No Moveware credentials found for coId:', coId, '— skipping write-back');
      }
    } else {
      console.warn('[accept] Missing coId/jobId — skipping Moveware write-back');
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
        // Included so the browser dev-tools / network tab can reveal any
        // Moveware write-back failures without needing server log access.
        ...(mwWritebackErrors.length > 0 && { mwErrors: mwWritebackErrors }),
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
