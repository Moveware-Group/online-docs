import { NextRequest, NextResponse } from 'next/server';
import { brandingService } from '@/lib/services';

const DEFAULT_COMPANY_ID = 'default';

export async function GET() {
  try {
    const branding = await brandingService.getBranding();
    return NextResponse.json(branding);
  } catch (error) {
    console.error('Error fetching branding:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branding settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { logoUrl, primaryColor, secondaryColor } = body;

    // Validate required fields
    if (!logoUrl && !primaryColor && !secondaryColor) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      );
    }

    // Validate color format if provided
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return NextResponse.json(
        { error: 'Primary color must be a valid hex color' },
        { status: 400 }
      );
    }
    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return NextResponse.json(
        { error: 'Secondary color must be a valid hex color' },
        { status: 400 }
      );
    }

    // Save branding settings using upsert
    const branding = await brandingService.upsertBranding(DEFAULT_COMPANY_ID, {
      logoUrl,
      primaryColor,
      secondaryColor,
    });

    return NextResponse.json(branding);
  } catch (error) {
    console.error('Error saving branding:', error);
    return NextResponse.json(
      { error: 'Failed to save branding settings' },
      { status: 500 }
    );
  }
}
