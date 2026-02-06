import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET all companies with their settings
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
    });

    // Fetch branding, hero and copy settings for each company
    const companiesWithAllData = await Promise.all(
      companies.map(async (company) => {
        const branding = await prisma.brandingSettings.findUnique({
          where: { companyId: company.id },
        });

        const hero = await prisma.heroSettings.findUnique({
          where: { companyId: company.id },
        });

        const copy = await prisma.copySettings.findUnique({
          where: { companyId: company.id },
        });

        return {
          id: company.id,
          companyId: company.id,
          companyName: company.name,
          logoUrl: branding?.logoUrl,
          primaryColor: branding?.primaryColor,
          secondaryColor: branding?.secondaryColor,
          fontFamily: branding?.fontFamily,
          heroHeading: hero?.title,
          heroSubheading: hero?.subtitle,
          heroBackgroundColor: hero?.backgroundColor,
          heroTextColor: hero?.textColor,
          welcomeMessage: copy?.welcomeMessage,
          introText: copy?.introText,
          footerText: copy?.footerText,
        };
      })
    );

    return NextResponse.json(companiesWithAllData);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST create or update company and settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      id,
      companyName,
      logoUrl,
      primaryColor,
      secondaryColor,
      fontFamily,
      heroHeading,
      heroSubheading,
      heroBackgroundColor,
      heroTextColor,
      welcomeMessage,
      introText,
      footerText,
    } = body;

    // Validate required fields
    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    let company;

    if (id) {
      // Update existing company
      company = await prisma.company.update({
        where: { id },
        data: {
          name: companyName,
        },
      });
    } else {
      // Create new company (requires apiKey to be generated)
      return NextResponse.json(
        { error: 'Creating new companies via this endpoint is not yet supported' },
        { status: 400 }
      );
    }

    // Upsert Branding Settings
    await prisma.brandingSettings.upsert({
      where: { companyId: company.id },
      update: {
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || '#2563eb',
        secondaryColor: secondaryColor || '#1e40af',
        fontFamily: fontFamily || 'Inter',
      },
      create: {
        companyId: company.id,
        logoUrl: logoUrl || null,
        primaryColor: primaryColor || '#2563eb',
        secondaryColor: secondaryColor || '#1e40af',
        fontFamily: fontFamily || 'Inter',
      },
    });

    // Upsert Hero Settings
    await prisma.heroSettings.upsert({
      where: { companyId: company.id },
      update: {
        title: heroHeading || 'Welcome',
        subtitle: heroSubheading || null,
        backgroundColor: heroBackgroundColor || '#2563eb',
        textColor: heroTextColor || '#ffffff',
      },
      create: {
        companyId: company.id,
        title: heroHeading || 'Welcome',
        subtitle: heroSubheading || null,
        backgroundColor: heroBackgroundColor || '#2563eb',
        textColor: heroTextColor || '#ffffff',
      },
    });

    // Upsert Copy Settings
    await prisma.copySettings.upsert({
      where: { companyId: company.id },
      update: {
        welcomeMessage: welcomeMessage || 'Welcome',
        introText: introText || '',
        footerText: footerText || null,
      },
      create: {
        companyId: company.id,
        welcomeMessage: welcomeMessage || 'Welcome',
        introText: introText || '',
        footerText: footerText || null,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error saving company:', error);
    return NextResponse.json(
      { 
        error: 'Failed to save company',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
