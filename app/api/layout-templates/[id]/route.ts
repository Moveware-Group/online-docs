/**
 * Layout Template detail API
 * GET    /api/layout-templates/[id]  — Fetch single template
 * PUT    /api/layout-templates/[id]  — Update template
 * DELETE /api/layout-templates/[id]  — Delete template
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = await (prisma as any).layoutTemplate.findUnique({
      where: { id },
      include: {
        brandingSettings: {
          include: { company: { select: { id: true, name: true, tenantId: true } } },
        },
      },
    });
    if (!template) {
      return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: { ...template, layoutConfig: JSON.parse(template.layoutConfig) },
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, layoutConfig, isActive, isDefault } = body;

    const updateData: Record<string, unknown> = { version: { increment: 1 } };
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (layoutConfig !== undefined) {
      updateData.layoutConfig = typeof layoutConfig === 'string' ? layoutConfig : JSON.stringify(layoutConfig);
    }

    // Setting a template as default → clear the flag on all others first
    if (isDefault === true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).layoutTemplate.updateMany({ data: { isDefault: false } });
      updateData.isDefault = true;
    } else if (isDefault === false) {
      updateData.isDefault = false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const template = await (prisma as any).layoutTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: { ...template, layoutConfig: JSON.parse(template.layoutConfig) },
    });
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ success: false, error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Unlink companies using this template before deleting
    await prisma.brandingSettings.updateMany({
      where: { layoutTemplateId: id } as never,
      data: { layoutTemplateId: null } as never,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).layoutTemplate.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete template' }, { status: 500 });
  }
}
