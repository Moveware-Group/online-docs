/**
 * POST /api/layout-templates/promote
 * Promotes a company's existing CustomLayout (or the Grace static layout)
 * into a reusable LayoutTemplate.
 *
 * Body: { companyId: string, name: string, description?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GRACE_STATIC_LAYOUT } from '@/lib/layouts/grace-static';

export async function POST(request: NextRequest) {
  try {
    const { companyId, name, description } = await request.json();

    if (!companyId || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'companyId and name are required' },
        { status: 400 },
      );
    }

    // Find the company's existing layout
    let layoutConfig: string | null = null;

    const existingLayout = await prisma.customLayout.findUnique({
      where: { companyId },
    });

    if (existingLayout) {
      layoutConfig = existingLayout.layoutConfig;
    } else {
      // Fall back to Grace static layout if it's a Grace company
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true, brandCode: true, tenantId: true },
      });
      const isGrace =
        company?.tenantId === '555' ||
        company?.brandCode?.toLowerCase().includes('grace') ||
        company?.name?.toLowerCase().includes('grace');

      if (isGrace) {
        layoutConfig = JSON.stringify(GRACE_STATIC_LAYOUT);
      }
    }

    if (!layoutConfig) {
      return NextResponse.json(
        { success: false, error: 'No layout found for this company to promote' },
        { status: 404 },
      );
    }

    // Create the template
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = await (prisma as any).layoutTemplate.create({
      data: {
        name: name.trim(),
        description: description || null,
        layoutConfig,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...template, layoutConfig: JSON.parse(template.layoutConfig) },
    });
  } catch (error) {
    console.error('Error promoting layout to template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to promote layout to template' },
      { status: 500 },
    );
  }
}
