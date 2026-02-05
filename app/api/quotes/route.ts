import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'email', 'phone', 'pickupAddress', 'deliveryAddress', 'moveDate'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Here you would typically:
    // 1. Save to database
    // 2. Send notification emails
    // 3. Integrate with external APIs
    
    // For now, just log and return success
    console.log('Quote request received:', body);

    return NextResponse.json(
      { 
        success: true, 
        message: 'Quote request submitted successfully',
        quoteId: `QUOTE-${Date.now()}`
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing quote request:', error);
    return NextResponse.json(
      { error: 'Failed to process quote request' },
      { status: 500 }
    );
  }
}
