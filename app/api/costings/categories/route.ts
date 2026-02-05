/**
 * Costings Categories API Route
 * GET /api/costings/categories - Get all costing categories
 */

import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/services/costingsService';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching costing categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch costing categories' },
      { status: 500 }
    );
  }
}
