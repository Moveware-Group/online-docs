/**
 * Job Details API
 * GET /api/jobs/[jobId]?coId=<companyTenantId>
 *
 * When Moveware API credentials are configured for the company (via Settings →
 * Companies → API Credentials), this proxies:
 *   GET https://rest.moveware-test.app/{coId}/api/jobs/{jobId}/quotations
 * and maps the response to the internal job shape.
 *
 * Falls back to mock data when credentials are absent or the upstream call fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  getMwCredentials,
  fetchMwQuotation,
  adaptMwQuotation,
  type InternalBranding,
} from '@/lib/services/moveware-api';

/** Mock job record — used when no live credentials are configured */
const MOCK_JOBS: Record<
  string,
  {
    id: number;
    titleName: string;
    firstName: string;
    lastName: string;
    moveManager: string;
    moveType: string;
    estimatedDeliveryDetails: string;
    jobValue: number;
    brandCode: string;
    branchCode: string;
    upliftLine1: string;
    upliftLine2: string;
    upliftCity: string;
    upliftState: string;
    upliftPostcode: string;
    upliftCountry: string;
    deliveryLine1: string;
    deliveryLine2: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryPostcode: string;
    deliveryCountry: string;
    measuresVolumeGrossM3: number;
    measuresWeightGrossKg: number;
  }
> = {
  '111505': {
    id: 111505,
    titleName: 'Mr',
    firstName: 'Leigh',
    lastName: 'Morrow',
    moveManager: 'Sarah Johnson',
    moveType: 'LR',
    estimatedDeliveryDetails: '27/02/2026',
    jobValue: 2675.0,
    brandCode: 'MWB',
    branchCode: 'MEL',
    upliftLine1: '3 Spring Water Crescent',
    upliftLine2: '',
    upliftCity: 'Cranbourne',
    upliftState: 'VIC',
    upliftPostcode: '3977',
    upliftCountry: 'Australia',
    deliveryLine1: '12 Cato Street',
    deliveryLine2: '',
    deliveryCity: 'Hawthorn East',
    deliveryState: 'VIC',
    deliveryPostcode: '3123',
    deliveryCountry: 'Australia',
    measuresVolumeGrossM3: 0.622965,
    measuresWeightGrossKg: 70,
  },
};

/** Build the branding block from a DB company record. */
async function resolveBranding(
  coId: string | null,
  /** Brand code from the URL ?brand= param; used to select the exact company
   *  when a tenant operates multiple brands with the same tenantId. */
  brandCode?: string | null,
): Promise<InternalBranding> {
  const defaults: InternalBranding = {
    companyName: 'Moveware',
    logoUrl: '',
    heroBannerUrl: '',
    footerImageUrl: '',
    primaryColor: '#1E40AF',
    secondaryColor: '#FFFFFF',
    fontFamily: 'Inter',
    inventoryWeightUnit: 'kg',
    footerBgColor: '#ffffff',
    footerTextColor: '#374151',
    footerAddressLine1: '',
    footerAddressLine2: '',
    footerPhone: '',
    footerEmail: '',
    footerAbn: '',
  };

  try {
    let company = null;
    if (coId) {
      // When a brand code is supplied, target the exact (tenantId, brandCode)
      // row so multi-brand tenants each resolve to their own Company record.
      const where = brandCode
        ? { tenantId: coId, brandCode }
        : { tenantId: coId };
      company = await prisma.company.findFirst({
        where,
        include: { brandingSettings: true },
      });
    }
    if (!company && brandCode) {
      // Fallback: look up by brandCode alone (e.g. preview mode without coId)
      company = await prisma.company.findFirst({
        where: { brandCode },
        include: { brandingSettings: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!company) return defaults;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bs = company.brandingSettings as any;
    return {
      companyName: company.name,
      logoUrl: bs?.logoUrl ?? company.logoUrl ?? '',
      heroBannerUrl: bs?.heroBannerUrl ?? '',
      footerImageUrl: bs?.footerImageUrl ?? '',
      primaryColor:
        bs?.primaryColor ??
        company.primaryColor ??
        defaults.primaryColor,
      secondaryColor:
        bs?.secondaryColor ??
        company.secondaryColor ??
        defaults.secondaryColor,
      fontFamily: bs?.fontFamily ?? defaults.fontFamily,
      inventoryWeightUnit: (bs?.inventoryWeightUnit as 'kg' | 'lbs') ?? 'kg',
      footerBgColor:      bs?.footerBgColor      ?? '#ffffff',
      footerTextColor:    bs?.footerTextColor     ?? '#374151',
      footerAddressLine1: bs?.footerAddressLine1  ?? '',
      footerAddressLine2: bs?.footerAddressLine2  ?? '',
      footerPhone:        bs?.footerPhone         ?? '',
      footerEmail:        bs?.footerEmail         ?? '',
      footerAbn:          bs?.footerAbn           ?? '',
    };
  } catch (err) {
    console.warn('[jobs/route] branding lookup failed:', err);
    return defaults;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const reqUrl = new URL(request.url);
    const coId  = reqUrl.searchParams.get('coId');
    const brand = reqUrl.searchParams.get('brand');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 },
      );
    }

    const branding = await resolveBranding(coId, brand);

    // ── Live Moveware API path ─────────────────────────────────────────────
    if (coId) {
      const creds = await getMwCredentials(coId);
      if (creds) {
        try {
          const raw = await fetchMwQuotation(creds, jobId);
          const job = adaptMwQuotation(raw, branding);
          return NextResponse.json({
            success: true,
            data: job,
            source: 'moveware',
          });
        } catch (err) {
          console.error(
            '[jobs/route] Moveware API failed, falling back to mock:',
            err,
          );
        }
      }
    }

    // ── Mock fallback ──────────────────────────────────────────────────────
    const mock = MOCK_JOBS[jobId];
    if (!mock) {
      return NextResponse.json(
        {
          success: false,
          error: `Job ${jobId} not found. Only mock job 111505 is available when no API credentials are configured.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...mock, branding },
      source: 'mock',
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job details' },
      { status: 500 },
    );
  }
}
