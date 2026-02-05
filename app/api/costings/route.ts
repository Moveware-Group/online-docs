/**
 * Costings API Route
 * GET /api/costings - Get all costing items
 * GET /api/costings?category=:id - Get items by category
 */

import { NextRequest, NextResponse } from 'next/server';
import { getItems, getItemsByCategory, getCategories } from '@/lib/services/costingsService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const includeCategories = searchParams.get('includeCategories');

    let items;
    let categories;

    if (categoryId) {
      items = await getItemsByCategory(categoryId);
    } else {
      items = await getItems();
    }

    if (includeCategories === 'true') {
      categories = await getCategories();
    }

    const response: any = { items };
    if (categories) {
      response.categories = categories;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching costings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch costings data' },
      { status: 500 }
    );
  }
}
