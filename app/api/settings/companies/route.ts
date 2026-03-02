import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * Expand shorthand hex (#RGB) to full 6-char form (#RRGGBB).
 * The Company.primaryColor column is VarChar(7), so we must store the full form.
 */
function normalizeHex(hex: string | undefined | null, fallback: string): string {
  if (!hex) return fallback;
  const trimmed = hex.trim();
  const match = trimmed.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (match) {
    return `#${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${match[3]}`;
  }
  // Validate it's a proper 6-char hex
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }
  return fallback;
}

/**
 * GET /api/settings/companies
 * Fetch all companies with their branding settings.
 * Returns data shaped to match the frontend CompanyBranding interface.
 */
export async function GET() {
  try {
    // Fetch companies with branding. documentLayouts is only included when the
    // company_document_layouts table exists (migration may not have run yet on
    // older deployments), so we fall back gracefully to a simpler query.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let companies: any[];
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      companies = await (prisma as any).company.findMany({
        orderBy: { name: 'asc' },
        include: {
          brandingSettings: true,
          documentLayouts: {
            include: { template: { select: { id: true, name: true, docType: true } } },
          },
        },
      });
    } catch {
      // Migration not yet run — fall back without documentLayouts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      companies = await (prisma as any).company.findMany({
        orderBy: { name: 'asc' },
        include: { brandingSettings: true },
      });
    }

    const result = companies.map((company: Record<string, unknown>) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bs = company.brandingSettings as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docLayouts = (company.documentLayouts as any[] | undefined) ?? [];

      // Build a map of docType → { templateId, templateName }
      const docTypeLayouts: Record<string, { templateId: string; templateName: string }> = {};
      for (const dl of docLayouts) {
        if (dl.template) {
          docTypeLayouts[dl.docType] = {
            templateId: dl.template.id,
            templateName: dl.template.name,
          };
        }
      }
      // Legacy quote layout from BrandingSettings — include it too
      if (bs?.layoutTemplateId && !docTypeLayouts.quote) {
        docTypeLayouts.quote = {
          templateId: bs.layoutTemplateId,
          templateName: 'Quote Layout',
        };
      }

      return {
        id: company.id,
        companyId: (company as Record<string, string>).tenantId,
        brandCode: (company as Record<string, string>).brandCode,
        companyName: (company as Record<string, string>).name,
        logoUrl: (company as Record<string, string | null>).logoUrl || bs?.logoUrl || '',
        heroBannerUrl: bs?.heroBannerUrl || '',
        footerImageUrl: bs?.footerImageUrl || '',
        primaryColor: (company as Record<string, string>).primaryColor || bs?.primaryColor || '#cc0000',
        secondaryColor: (company as Record<string, string>).secondaryColor || bs?.secondaryColor || '#ffffff',
        tertiaryColor: (company as Record<string, string>).tertiaryColor || '#5a5a5a',
        fontFamily: bs?.fontFamily || 'Inter',
        // Legacy field — kept for backward compatibility
        layoutTemplateId: bs?.layoutTemplateId || null,
        // Per-docType layout assignments
        docTypeLayouts,
        // Moveware API credentials — password is never returned to the browser
        mwUsername: bs?.mwUsername || '',
        mwPasswordSet: !!(bs?.mwPassword),
        inventoryWeightUnit: (bs?.inventoryWeightUnit as 'kg' | 'lbs') || 'kg',
        footerBgColor:      bs?.footerBgColor      || '#ffffff',
        footerTextColor:    bs?.footerTextColor     || '#374151',
        footerAddressLine1: bs?.footerAddressLine1  || '',
        footerAddressLine2: bs?.footerAddressLine2  || '',
        footerPhone:        bs?.footerPhone         || '',
        footerEmail:        bs?.footerEmail         || '',
        footerAbn:          bs?.footerAbn           || '',
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings/companies
 * Create a new company or update an existing one.
 *
 * Body shape (matches frontend CompanyBranding):
 * {
 *   id?:            string   — if present, update; otherwise create
 *   companyId:      string   — tenantId (numeric company ID)
 *   brandCode:      string
 *   companyName:    string
 *   logoUrl?:       string
 *   primaryColor?:  string
 *   secondaryColor?: string
 *   tertiaryColor?: string
 *   fontFamily?:    string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

      const {
      id,
      companyId,
      brandCode,
      companyName,
      logoUrl,
      heroBannerUrl,
      footerImageUrl,
      primaryColor,
      secondaryColor,
      tertiaryColor,
      fontFamily,
      mwUsername,
      mwPassword,
      inventoryWeightUnit,
      footerBgColor,
      footerTextColor,
      footerAddressLine1,
      footerAddressLine2,
      footerPhone,
      footerEmail,
      footerAbn,
    } = body;

    // Validate required fields
    if (!companyName?.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }
    if (!companyId?.toString().trim()) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }
    if (!brandCode?.trim()) {
      return NextResponse.json(
        { error: 'Brand code is required' },
        { status: 400 }
      );
    }

    // Normalize hex colors to 7-char form (#RRGGBB) for VarChar(7) columns
    const normPrimary = normalizeHex(primaryColor, '#cc0000');
    const normSecondary = normalizeHex(secondaryColor, '#ffffff');
    const normTertiary = normalizeHex(tertiaryColor, '#5a5a5a');

    let company;

    if (id) {
      // ── Update existing company ──
      company = await prisma.company.update({
        where: { id },
        data: {
          name: companyName.trim(),
          tenantId: companyId.toString().trim(),
          brandCode: brandCode.trim(),
          primaryColor: normPrimary,
          secondaryColor: normSecondary,
          tertiaryColor: normTertiary,
          logoUrl: logoUrl || null,
        },
      });

      // Upsert branding settings.
      // mwPassword is only updated when a non-empty value is sent (preserves existing).
      // Build data objects as plain records so we can include the new mwUsername/mwPassword
      // fields without Prisma-generated-type errors (run `npx prisma generate` to resolve).
      const brandingBase: Record<string, unknown> = {
        logoUrl: logoUrl || null,
        heroBannerUrl: heroBannerUrl || null,
        footerImageUrl: footerImageUrl || null,
        primaryColor: normPrimary,
        secondaryColor: normSecondary,
        fontFamily: fontFamily || 'Inter',
        mwUsername: mwUsername?.trim() || null,
        inventoryWeightUnit: inventoryWeightUnit || 'kg',
        footerBgColor:      footerBgColor      || '#ffffff',
        footerTextColor:    footerTextColor     || '#374151',
        footerAddressLine1: footerAddressLine1  || null,
        footerAddressLine2: footerAddressLine2  || null,
        footerPhone:        footerPhone         || null,
        footerEmail:        footerEmail         || null,
        footerAbn:          footerAbn           || null,
      };
      if (mwPassword?.trim()) brandingBase.mwPassword = mwPassword.trim();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.brandingSettings.upsert as any)({
        where: { companyId: company.id },
        update: brandingBase,
        create: { companyId: company.id, ...brandingBase },
      });
    } else {
      // ── Create new company ──
      company = await prisma.company.create({
        data: {
          name: companyName.trim(),
          apiKey: randomUUID(),
          tenantId: companyId.toString().trim(),
          brandCode: brandCode.trim(),
          primaryColor: normPrimary,
          secondaryColor: normSecondary,
          tertiaryColor: normTertiary,
          logoUrl: logoUrl || null,
        },
      });

      // Look up the default template (if one has been marked) to auto-assign
      let defaultTemplateId: string | null = null;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const defaultTmpl = await (prisma as any).layoutTemplate.findFirst({
          where: { isDefault: true, isActive: true },
          select: { id: true },
        });
        defaultTemplateId = defaultTmpl?.id ?? null;
      } catch {
        // isDefault column may not exist yet (pre-migration) — proceed without it
      }

      // Create branding settings, optionally wiring up the default template.
      const newBrandingData: Record<string, unknown> = {
        companyId: company.id,
        logoUrl: logoUrl || null,
        heroBannerUrl: heroBannerUrl || null,
        footerImageUrl: footerImageUrl || null,
        primaryColor: normPrimary,
        secondaryColor: normSecondary,
        fontFamily: fontFamily || 'Inter',
        mwUsername: mwUsername?.trim() || null,
        mwPassword: mwPassword?.trim() || null,
        inventoryWeightUnit: inventoryWeightUnit || 'kg',
        footerBgColor:      footerBgColor      || '#ffffff',
        footerTextColor:    footerTextColor     || '#374151',
        footerAddressLine1: footerAddressLine1  || null,
        footerAddressLine2: footerAddressLine2  || null,
        footerPhone:        footerPhone         || null,
        footerEmail:        footerEmail         || null,
        footerAbn:          footerAbn           || null,
        ...(defaultTemplateId ? { layoutTemplateId: defaultTemplateId } : {}),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.brandingSettings.create as any)({ data: newBrandingData });
    }

    // Return response in the same shape the GET endpoint uses
    // Password is never returned — only whether one is set
    const response = {
      id: company.id,
      companyId: company.tenantId,
      brandCode: company.brandCode,
      companyName: company.name,
      logoUrl: company.logoUrl || '',
      heroBannerUrl: heroBannerUrl || '',
      footerImageUrl: footerImageUrl || '',
      primaryColor: company.primaryColor,
      secondaryColor: company.secondaryColor,
      tertiaryColor: company.tertiaryColor,
      fontFamily: fontFamily || 'Inter',
      mwUsername: mwUsername?.trim() || '',
      mwPasswordSet: !!(mwPassword?.trim()),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error saving company:', error);

    // Handle unique constraint violation (duplicate tenantId + brandCode)
    if (
      error instanceof Error &&
      error.message.includes('Unique constraint')
    ) {
      return NextResponse.json(
        { error: 'A company with this Company ID and Brand Code already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to save company',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
