/**
 * List all company custom layouts
 * GET /api/layouts/list
 *
 * Returns every CustomLayout record with its associated company details
 * and the parsed layoutConfig JSON.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const layouts = await prisma.customLayout.findMany({
      include: {
        company: {
          select: { id: true, name: true, brandCode: true, tenantId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const data = layouts.map((l) => {
      let layoutConfig: unknown = l.layoutConfig;
      try {
        layoutConfig = JSON.parse(l.layoutConfig);
      } catch {
        // keep as string if not valid JSON
      }
      return { ...l, layoutConfig };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error listing custom layouts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list custom layouts' },
      { status: 500 },
    );
  }
}
