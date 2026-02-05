import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📝 Received quote acceptance request:', {
      jobId: body.jobId,
      costingItemId: body.costingItemId,
      signatureName: body.signatureName,
      reloFromDate: body.reloFromDate,
    });
    
    const {
      jobId,
      costingItemId,
      signatureName,
      reloFromDate,
      insuredValue,
      purchaseOrderNumber,
      specialRequirements,
      signatureData,
      agreedToTerms,
    } = body;

    // Validate required fields
    if (!jobId || !costingItemId || !signatureName || !reloFromDate || !insuredValue || !purchaseOrderNumber || !signatureData) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Save quote acceptance to database
    console.log('💾 Saving to database...');
    const quoteAcceptance = await prisma.quoteAcceptance.create({
      data: {
        jobId: parseInt(jobId),
        costingItemId,
        signatureName,
        reloFromDate,
        insuredValue,
        purchaseOrderNumber,
        specialRequirements: specialRequirements || null,
        signatureData,
        agreedToTerms,
        status: 'accepted',
      },
    });

    console.log('✅ Quote acceptance saved successfully:', quoteAcceptance.id);

    return NextResponse.json(
      {
        success: true,
        data: quoteAcceptance,
        message: 'Quote accepted successfully',
      },
      { status: 201 }
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
