/**
 * POST /api/layout-templates/promote
 * Previously promoted a company's CustomLayout to a LayoutTemplate.
 * CustomLayouts have been removed — all layouts are now LayoutTemplates.
 * This endpoint is kept to avoid 404s from any cached clients but always
 * returns a 410 Gone response directing callers to the new flow.
 */

import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Company Layouts have been removed. Create a template directly via POST /api/layout-templates with a layoutConfig.',
    },
    { status: 410 },
  );
}
