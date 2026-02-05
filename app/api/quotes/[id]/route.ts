import { NextRequest, NextResponse } from 'next/server';
import { QuoteData, QuoteResponse } from '@/lib/types/quote';

// GET /api/quotes/[id] - Fetch quote details by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: Replace with actual database query
    // For now, returning mock data for demonstration
    const mockQuoteData: QuoteData = {
      jobDetails: {
        id,
        quoteNumber: `QT-${id.slice(0, 8).toUpperCase()}`,
        status: 'pending',
        customer: {
          name: 'John Smith',
          email: 'john.smith@example.com',
          phone: '+61 400 123 456',
        },
        moveDate: '2024-02-15',
        origin: {
          street: '123 Melbourne Street',
          city: 'Melbourne',
          state: 'VIC',
          postcode: '3000',
          country: 'Australia',
        },
        destination: {
          street: '456 Sydney Avenue',
          city: 'Sydney',
          state: 'NSW',
          postcode: '2000',
          country: 'Australia',
        },
        notes: 'Please handle antique furniture with extra care. Access via rear elevator.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      inventory: [
        {
          id: '1',
          name: '3 Seater Sofa',
          category: 'Living Room',
          quantity: 1,
          volume: 2.5,
          weight: 85,
          fragile: false,
        },
        {
          id: '2',
          name: 'Queen Bed Frame',
          category: 'Bedroom',
          quantity: 1,
          volume: 3.2,
          weight: 65,
          fragile: false,
        },
        {
          id: '3',
          name: 'Dining Table',
          category: 'Dining Room',
          quantity: 1,
          volume: 2.8,
          weight: 75,
          fragile: false,
        },
        {
          id: '4',
          name: 'Dining Chairs',
          category: 'Dining Room',
          quantity: 6,
          volume: 1.2,
          weight: 12,
          fragile: false,
        },
        {
          id: '5',
          name: 'Bookshelf',
          category: 'Study',
          quantity: 2,
          volume: 1.8,
          weight: 45,
          fragile: false,
        },
        {
          id: '6',
          name: 'TV (65")',
          category: 'Living Room',
          quantity: 1,
          volume: 0.5,
          weight: 28,
          fragile: true,
        },
        {
          id: '7',
          name: 'Wardrobe',
          category: 'Bedroom',
          quantity: 2,
          volume: 4.5,
          weight: 95,
          fragile: false,
        },
        {
          id: '8',
          name: 'Boxes (Standard)',
          category: 'Miscellaneous',
          quantity: 25,
          volume: 1.5,
          weight: 15,
          fragile: false,
        },
      ],
      costings: {
        items: [
          {
            id: '1',
            category: 'Labor',
            description: 'Moving Team (3 movers x 8 hours)',
            quantity: 24,
            unitPrice: 75,
            totalPrice: 1800,
          },
          {
            id: '2',
            category: 'Transport',
            description: 'Truck Hire (Large)',
            quantity: 1,
            unitPrice: 450,
            totalPrice: 450,
          },
          {
            id: '3',
            category: 'Materials',
            description: 'Packing Materials & Boxes',
            quantity: 1,
            unitPrice: 280,
            totalPrice: 280,
          },
          {
            id: '4',
            category: 'Insurance',
            description: 'Transit Insurance Coverage',
            quantity: 1,
            unitPrice: 175,
            totalPrice: 175,
          },
          {
            id: '5',
            category: 'Fuel',
            description: 'Fuel Surcharge (Melbourne to Sydney)',
            quantity: 1,
            unitPrice: 320,
            totalPrice: 320,
          },
        ],
        subtotal: 3025,
        tax: 302.5,
        taxRate: 0.1,
        total: 3327.5,
        currency: 'AUD',
      },
    };

    const response: QuoteResponse = {
      success: true,
      data: mockQuoteData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching quote:', error);
    
    const errorResponse: QuoteResponse = {
      success: false,
      error: 'Failed to fetch quote details',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
