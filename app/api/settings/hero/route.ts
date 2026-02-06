import { NextRequest, NextResponse } from 'next/server';
import { heroService } from '@/lib/services';

const DEFAULT_COMPANY_ID = 'default';

export async function GET() {
  try {
    const hero = await heroService.getHero();
    return NextResponse.json(hero);
  } catch (error) {
    console.error('Error fetching hero content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hero content' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { backgroundImage, title, subtitle, backgroundColor, textColor, showLogo, alignment } = body;

    // Validate at least one field is provided
    if (!backgroundImage && !title && !subtitle && !backgroundColor && !textColor && showLogo === undefined && !alignment) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (backgroundImage !== undefined) updateData.backgroundImage = backgroundImage;
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.subtitle = subtitle;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (showLogo !== undefined) updateData.showLogo = showLogo;
    if (alignment !== undefined) updateData.alignment = alignment;

    // Save hero content using upsert
    const hero = await heroService.upsertHero(DEFAULT_COMPANY_ID, updateData);

    return NextResponse.json(hero);
  } catch (error) {
    console.error('Error saving hero content:', error);
    return NextResponse.json(
      { error: 'Failed to save hero content' },
      { status: 500 }
    );
  }
}
