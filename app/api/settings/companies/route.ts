import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * GET /api/settings/companies
 * Fetch all companies with their branding settings.
 * Returns data shaped to match the frontend CompanyBranding interface.
 */
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        brandingSettings: true,
      },
    });

    const result = companies.map((company) => ({
      id: company.id,
      companyId: company.tenantId,
      brandCode: company.brandCode,
      companyName: company.name,
      logoUrl: company.logoUrl || company.brandingSettings?.logoUrl || '',
      primaryColor: company.primaryColor || company.brandingSettings?.primaryColor || '#cc0000',
      secondaryColor: company.secondaryColor || company.brandingSettings?.secondaryColor || '#ffffff',
      tertiaryColor: company.tertiaryColor || '#5a5a5a',
      fontFamily: company.brandingSettings?.fontFamily || 'Inter',
    }));

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
      primaryColor,
      secondaryColor,
      tertiaryColor,
      fontFamily,
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

    let company;

    if (id) {
      // ── Update existing company ──
      company = await prisma.company.update({
        where: { id },
        data: {
          name: companyName.trim(),
          tenantId: companyId.toString().trim(),
          brandCode: brandCode.trim(),
          primaryColor: primaryColor || '#cc0000',
          secondaryColor: secondaryColor || '#ffffff',
          tertiaryColor: tertiaryColor || '#5a5a5a',
          logoUrl: logoUrl || null,
        },
      });

      // Upsert branding settings
      await prisma.brandingSettings.upsert({
        where: { companyId: company.id },
        update: {
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || '#cc0000',
          secondaryColor: secondaryColor || '#ffffff',
          fontFamily: fontFamily || 'Inter',
        },
        create: {
          companyId: company.id,
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || '#cc0000',
          secondaryColor: secondaryColor || '#ffffff',
          fontFamily: fontFamily || 'Inter',
        },
      });
    } else {
      // ── Create new company ──
      company = await prisma.company.create({
        data: {
          name: companyName.trim(),
          apiKey: randomUUID(),
          tenantId: companyId.toString().trim(),
          brandCode: brandCode.trim(),
          primaryColor: primaryColor || '#cc0000',
          secondaryColor: secondaryColor || '#ffffff',
          tertiaryColor: tertiaryColor || '#5a5a5a',
          logoUrl: logoUrl || null,
        },
      });

      // Create branding settings
      await prisma.brandingSettings.create({
        data: {
          companyId: company.id,
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || '#cc0000',
          secondaryColor: secondaryColor || '#ffffff',
          fontFamily: fontFamily || 'Inter',
        },
      });
    }

    // Return response in the same shape the GET endpoint uses
    const response = {
      id: company.id,
      companyId: company.tenantId,
      brandCode: company.brandCode,
      companyName: company.name,
      logoUrl: company.logoUrl || '',
      primaryColor: company.primaryColor,
      secondaryColor: company.secondaryColor,
      tertiaryColor: company.tertiaryColor,
      fontFamily: fontFamily || 'Inter',
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
