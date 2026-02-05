import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET all companies
export async function GET() {
  try {
    const companies = await prisma.branding.findMany({
      orderBy: { companyName: 'asc' },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

// POST create or update company
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
    if (!companyId || !brandCode || !companyName) {
      return NextResponse.json(
        { error: 'Company ID, brand code, and company name are required' },
        { status: 400 }
      );
    }

    let company;

    if (id) {
      // Update existing company
      company = await prisma.branding.update({
        where: { id },
        data: {
          companyId,
          brandCode,
          companyName,
          logoUrl: logoUrl || null,
          primaryColor,
          secondaryColor,
          tertiaryColor: tertiaryColor || null,
          fontFamily,
        },
      });
    } else {
      // Create new company
      company = await prisma.branding.create({
        data: {
          companyId,
          brandCode,
          companyName,
          logoUrl: logoUrl || null,
          primaryColor,
          secondaryColor,
          tertiaryColor: tertiaryColor || null,
          fontFamily,
        },
      });
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Error saving company:', error);
    return NextResponse.json(
      { error: 'Failed to save company' },
      { status: 500 }
    );
  }
}
