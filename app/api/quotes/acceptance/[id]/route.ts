import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const acceptance = await prisma.quoteAcceptance.findUnique({
      where: { id },
    });

    if (!acceptance) {
      return NextResponse.json(
        { success: false, error: 'Quote acceptance not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: acceptance,
    });
  } catch (error) {
    console.error('Error fetching quote acceptance:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch quote acceptance',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
