/**
 * POST /api/layouts/migrate
 * One-time migration that converted CustomLayout records to LayoutTemplates.
 * Migration has already been run — CustomLayouts no longer exist in the schema.
 * Kept to avoid 404s; always returns a 410 Gone.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Migration already completed. CustomLayouts have been removed from the schema.',
    },
    { status: 410 },
  );
}
