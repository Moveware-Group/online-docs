/**
 * POST /api/layout-templates/[id]/assign
 * Assign this template to one or more companies (updates BrandingSettings.layoutTemplateId).
 * Body: { companyIds: string[] }
 *
 * POST /api/layout-templates/[id]/assign with companyId:null to unassign.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { companyId, unassign } = await request.json();

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'companyId is required' }, { status: 400 });
    }

    // Verify template exists (unless unassigning)
    if (!unassign) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const template = await (prisma as any).layoutTemplate.findUnique({ where: { id } });
      if (!template) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }
    }

    // Upsert branding settings with the new layoutTemplateId
    await prisma.brandingSettings.upsert({
      where: { companyId },
      update: { layoutTemplateId: unassign ? null : id } as never,
      create: { companyId, layoutTemplateId: unassign ? null : id } as never,
    });

    return NextResponse.json({
      success: true,
      message: unassign ? 'Template unassigned' : 'Template assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning template:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign template' }, { status: 500 });
  }
}
