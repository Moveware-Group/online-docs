import { NextRequest, NextResponse } from 'next/server';
import { copyService } from '@/lib/services';

const DEFAULT_COMPANY_ID = 'default';

export async function GET() {
  try {
    const copy = await copyService.getCopy();
    
    if (copy) {
      return NextResponse.json({
        welcomeMessage: copy.welcomeMessage || '',
        introText: copy.introText || '',
        footerText: copy.footerText || '',
        submitButtonText: copy.submitButtonText || 'Submit',
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
    const { welcomeMessage, introText, footerText, submitButtonText } = body;

    // Validate at least one field is provided
    if (!welcomeMessage && !introText && !footerText && !submitButtonText) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage;
    if (introText !== undefined) updateData.introText = introText;
    if (footerText !== undefined) updateData.footerText = footerText;
    if (submitButtonText !== undefined) updateData.submitButtonText = submitButtonText;

    // Save copy content using upsert
    const copy = await copyService.upsertCopy(DEFAULT_COMPANY_ID, updateData);

    return NextResponse.json({
      welcomeMessage: copy.welcomeMessage || '',
      introText: copy.introText || '',
      footerText: copy.footerText || '',
      submitButtonText: copy.submitButtonText || 'Submit',
    });
  } catch (error) {
    console.error('Error saving copy content:', error);
    return NextResponse.json(
      { error: 'Failed to save copy content' },
      { status: 500 }
    );
  }
}
