/**
 * Costing Item API Route
 * GET /api/costings/:itemId - Get a specific costing item
 */

import { NextRequest, NextResponse } from 'next/server';
import { getItemById } from '@/lib/services/costingsService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const item = await getItemById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Costing item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error fetching costing item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch costing item' },
      { status: 500 }
    );
  }
}
