import { NextRequest, NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/data/storage';
import { CreateQuoteRequest, CreateQuoteResponse, QuoteResponse } from '@/lib/types/quote';

const QUOTES_FILE = 'quotes.json';

async function loadQuotes(): Promise<QuoteResponse[]> {
  const data = await readData<QuoteResponse[]>(QUOTES_FILE);
  return data ?? [];
}

async function saveQuotes(quotes: QuoteResponse[]): Promise<void> {
  await writeData(QUOTES_FILE, quotes);
}

/**
 * POST /api/quotes
 * Create a new quote with signature and form data
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateQuoteRequest = await request.json();

    // Validate required fields
    if (!body.customerName || !body.email || !body.phone || !body.serviceType) {
      return NextResponse.json<CreateQuoteResponse>(
        {
          success: false,
          error: 'Missing required fields: customerName, email, phone, and serviceType are required',
        },
        { status: 400 }
      );
    }

    // Validate signature data
    if (!body.signatureData || !body.typedName) {
      return NextResponse.json<CreateQuoteResponse>(
        {
          success: false,
          error: 'Signature data and typed name are required',
        },
        { status: 400 }
      );
    }

    // Validate terms acceptance
    if (!body.acceptedTerms) {
      return NextResponse.json<CreateQuoteResponse>(
        {
          success: false,
          error: 'Terms and conditions must be accepted',
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json<CreateQuoteResponse>(
        {
          success: false,
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    // Validate phone format (basic check)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json<CreateQuoteResponse>(
        {
          success: false,
          error: 'Invalid phone number format',
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const quote: QuoteResponse = {
      id: `QUOTE-${now.getTime()}`,
      customerName: body.customerName.trim(),
      email: body.email.toLowerCase().trim(),
      phone: body.phone.trim(),
      address: body.address?.trim() || undefined,
      serviceType: body.serviceType,
      moveDate: body.moveDate?.trim() || undefined,
      details: body.details?.trim() || undefined,
      signatureData: body.signatureData,
      typedName: body.typedName.trim(),
      acceptedTerms: body.acceptedTerms,
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const quotes = await loadQuotes();
    quotes.push(quote);
    await saveQuotes(quotes);

    return NextResponse.json<CreateQuoteResponse>(
      {
        success: true,
        quote,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json<CreateQuoteResponse>(
      {
        success: false,
        error: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/quotes
 * Retrieve all quotes (with optional filtering)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const email = searchParams.get('email');

    let quotes = await loadQuotes();

    if (status) {
      quotes = quotes.filter((quote) => quote.status === status);
    }

    if (email) {
      const emailLower = email.toLowerCase();
      quotes = quotes.filter((quote) => quote.email.toLowerCase() === emailLower);
    }

    // Sort by newest first
    quotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, quotes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error. Please try again later.',
      },
      { status: 500 }
    );
  }
}
