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
    const { imageUrl, title, subtitle } = body;

    // Validate at least one field is provided
    if (!imageUrl && !title && !subtitle) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      );
    }

    // Save hero content using upsert
    const hero = await heroService.upsertHero(DEFAULT_COMPANY_ID, {
      imageUrl,
      heading: title,
      subheading: subtitle,
    });

    return NextResponse.json(hero);
  } catch (error) {
    console.error('Error saving hero content:', error);
    return NextResponse.json(
      { error: 'Failed to save hero content' },
      { status: 500 }
    );
  }
}
