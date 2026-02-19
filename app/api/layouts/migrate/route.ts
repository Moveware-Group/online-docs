/**
 * POST /api/layouts/migrate
 *
 * One-time migration: promotes every existing CustomLayout record into a
 * LayoutTemplate and assigns it to the company via BrandingSettings.layoutTemplateId.
 *
 * Safe to run multiple times — skips companies that already have a
 * layoutTemplateId assigned in their BrandingSettings.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    const customLayouts = await prisma.customLayout.findMany({
      include: {
        company: {
          include: { brandingSettings: true },
        },
      },
    });

    const results: { company: string; action: string }[] = [];

    for (const cl of customLayouts) {
      const company = cl.company;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const branding = company.brandingSettings as any;

      // Skip if already has a template assigned
      if (branding?.layoutTemplateId) {
        results.push({ company: company.name, action: 'skipped — already has a template assigned' });
        continue;
      }

      // Create a LayoutTemplate from this company's saved layout
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const template = await (prisma as any).layoutTemplate.create({
        data: {
          name: `${company.name} Layout`,
          description: `Migrated from company layout for ${company.name}`,
          layoutConfig: cl.layoutConfig,
          isActive: cl.isActive,
          isDefault: false,
          createdBy: 'migration',
        },
      });

      // Assign the new template to the company via BrandingSettings
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).brandingSettings.upsert({
        where: { companyId: company.id },
        update: { layoutTemplateId: template.id },
        create: {
          companyId: company.id,
          layoutTemplateId: template.id,
        },
      });

      results.push({
        company: company.name,
        action: `migrated → template "${template.name}" (${template.id})`,
      });
    }

    return NextResponse.json({
      success: true,
      total: customLayouts.length,
      migrated: results.filter((r) => r.action.startsWith('migrated')).length,
      skipped: results.filter((r) => r.action.startsWith('skipped')).length,
      results,
    });
  } catch (error) {
    console.error('Layout migration error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
