import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📝 Received quote acceptance request:', {
      quoteNumber: body.quoteNumber,
      signatureName: body.signatureName,
    });
    
    const {
      quoteNumber,
      signatureName,
      signatureData,
      agreedToTerms,
    } = body;

    // Validate required fields
    if (!quoteNumber || !signatureName || !signatureData) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: quoteNumber, signatureName, and signatureData' },
        { status: 400 }
      );
    }

    if (!agreedToTerms) {
      console.error('❌ Validation failed: Terms not agreed');
      return NextResponse.json(
        { error: 'You must agree to the terms and conditions' },
        { status: 400 }
      );
    }

    // Update quote with acceptance details
    console.log('💾 Updating quote in database...');
    const updatedQuote = await prisma.quote.update({
      where: {
        quoteNumber,
      },
      data: {
        status: 'accepted',
        termsAccepted: true,
        acceptedAt: new Date(),
        acceptedBy: signatureName,
        signatureData,
      },
    });

    console.log('✅ Quote acceptance saved successfully:', updatedQuote.id);

    return NextResponse.json(
      {
        success: true,
        data: updatedQuote,
        message: 'Quote accepted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error accepting quote:', error);

    return NextResponse.json(
      { 
        error: 'Failed to accept quote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
