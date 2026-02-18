/**
 * POST /api/layout-templates/promote
 * Promotes a company's existing saved CustomLayout into a reusable LayoutTemplate.
 *
 * Body: { companyId: string, name: string, description?: string }
 *
 * Requires the company to already have a saved CustomLayout in the database.
 * To create a template from a built-in base layout use POST /api/layout-templates
 * directly with the desired layoutConfig.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { companyId, name, description } = await request.json();

    if (!companyId || !name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'companyId and name are required' },
        { status: 400 },
      );
    }

    const existingLayout = await prisma.customLayout.findUnique({
      where: { companyId },
    });

    if (!existingLayout) {
      return NextResponse.json(
        { success: false, error: 'No saved layout found for this company. Open the Layout Builder and save the layout first.' },
        { status: 404 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = await (prisma as any).layoutTemplate.create({
      data: {
        name: name.trim(),
        description: description || null,
        layoutConfig: existingLayout.layoutConfig,
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
