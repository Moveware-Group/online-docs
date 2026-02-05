import { NextRequest, NextResponse } from 'next/server';
import { copyService } from '@/lib/services';

const DEFAULT_COMPANY_ID = 'default';

export async function GET() {
  try {
    const copy = await copyService.getCopy();
    
    // Map Prisma fields to frontend expected fields
    if (copy) {
      return NextResponse.json({
        welcomeMessage: copy.tagline || '',
        ctaText: copy.description || '',
        footerText: copy.metaDescription || '',
      });
    }
    
    return NextResponse.json(null);
  } catch (error) {
    console.error('Error fetching copy content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch copy content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { welcomeMessage, ctaText, footerText } = body;

    // Validate at least one field is provided
    if (!welcomeMessage && !ctaText && !footerText) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      );
    }

    // Map frontend fields to Prisma model fields
    const updateData: any = {};
    if (welcomeMessage !== undefined) updateData.tagline = welcomeMessage;
    if (ctaText !== undefined) updateData.description = ctaText;
    if (footerText !== undefined) updateData.metaDescription = footerText;

    // Save copy content using upsert
    const copy = await copyService.upsertCopy(DEFAULT_COMPANY_ID, updateData);

    // Return data in frontend expected format
    return NextResponse.json({
      welcomeMessage: copy.tagline || '',
      ctaText: copy.description || '',
      footerText: copy.metaDescription || '',
    });
  } catch (error) {
    console.error('Error saving copy content:', error);
    return NextResponse.json(
      { error: 'Failed to save copy content' },
      { status: 500 }
    );
  }
}
