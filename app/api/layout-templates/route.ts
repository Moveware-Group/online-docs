/**
 * Layout Templates API
 * GET  /api/layout-templates        — List all templates
 * POST /api/layout-templates        — Create a new template
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const templates = await (prisma as any).layoutTemplate.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        brandingSettings: {
          include: { company: { select: { id: true, name: true, tenantId: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching layout templates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch layout templates' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, layoutConfig, createdBy } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: 'Template name is required' }, { status: 400 });
    }
    if (!layoutConfig) {
      return NextResponse.json({ success: false, error: 'layoutConfig is required' }, { status: 400 });
    }

    const configString = typeof layoutConfig === 'string' ? layoutConfig : JSON.stringify(layoutConfig);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = await (prisma as any).layoutTemplate.create({
      data: {
        name: name.trim(),
        description: description || null,
        layoutConfig: configString,
        createdBy: createdBy || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { ...template, layoutConfig: JSON.parse(template.layoutConfig) },
    });
  } catch (error) {
    console.error('Error creating layout template:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create layout template' },
      { status: 500 },
    );
  }
}
