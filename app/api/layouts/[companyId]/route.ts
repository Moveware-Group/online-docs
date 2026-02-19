/**
 * Layout API
 * GET    /api/layouts/[companyId] - Fetch layout for a company
 * PUT    /api/layouts/[companyId] - Save layout for a company (creates/updates a LayoutTemplate)
 * DELETE /api/layouts/[companyId] - Unassign the layout template from this company
 *
 * Priority order for GET:
 *   1. Layout Template assigned to this company (BrandingSettings.layoutTemplateId)
 *   2. Global default LayoutTemplate (isDefault = true) — applies to ALL companies
 *      that have no assigned template
 *   3. 404 — caller falls back to the hard-coded default React quote template
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Merge company-specific branding overrides (hero banner, footer image, font)
 * into the layout's globalStyles so each company keeps its own imagery even
 * when sharing a template.
 */
async function mergeCompanyBrandingIntoLayout(
  companyId: string,
  layoutConfig: { globalStyles?: Record<string, string> }
): Promise<typeof layoutConfig> {
  try {
    const company = await prisma.company.findFirst({
      where: {
        OR: [{ id: companyId }, { tenantId: companyId }],
      },
      include: { brandingSettings: true },
    });
    const branding = company?.brandingSettings;
    if (!branding) return layoutConfig;

    const overrides: Record<string, string> = {};
    if (branding.fontFamily) overrides.fontFamily = branding.fontFamily;
    if (branding.heroBannerUrl) overrides.heroBannerUrl = branding.heroBannerUrl;
    if (branding.footerImageUrl) overrides.footerImageUrl = branding.footerImageUrl;

    if (Object.keys(overrides).length === 0) return layoutConfig;

    return {
      ...layoutConfig,
      globalStyles: {
        ...layoutConfig.globalStyles,
        ...overrides,
      },
    };
  } catch {
    return layoutConfig;
  }
}

/** Resolve a company record from either its internal ID or its tenantId (coId). */
async function resolveCompany(companyId: string) {
  return prisma.company.findFirst({
    where: { OR: [{ id: companyId }, { tenantId: companyId }] },
    select: { id: true, name: true, brandCode: true, tenantId: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    const company = await resolveCompany(companyId);

    // ── Priority 1: Layout Template assigned to this company ─────────────────
    if (company) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const branding = await (prisma as any).brandingSettings.findUnique({
          where: { companyId: company.id },
          select: { layoutTemplateId: true },
        }) as { layoutTemplateId?: string | null } | null;

        if (branding?.layoutTemplateId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tmpl = await (prisma as any).layoutTemplate.findUnique({
            where: { id: branding.layoutTemplateId },
          });
          if (tmpl && tmpl.isActive) {
            let layoutConfig;
            try { layoutConfig = JSON.parse(tmpl.layoutConfig); } catch { layoutConfig = tmpl.layoutConfig; }
            const merged = await mergeCompanyBrandingIntoLayout(company.id, layoutConfig);
            return NextResponse.json({
              success: true,
              data: {
                id: tmpl.id,
                companyId: company.id,
                layoutConfig: merged,
                templateId: tmpl.id,
                templateName: tmpl.name,
                version: tmpl.version,
                isActive: tmpl.isActive,
                source: "layout_template",
              },
            });
          }
        }
      } catch {
        // layoutTemplateId column may not exist yet (pre-migration) — fall through
      }
    }

    // ── Priority 2: Global isDefault LayoutTemplate ───────────────────────────
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const defaultTmpl = await (prisma as any).layoutTemplate.findFirst({
        where: { isDefault: true, isActive: true },
      });
      if (defaultTmpl) {
        let layoutConfig;
        try { layoutConfig = JSON.parse(defaultTmpl.layoutConfig); } catch { layoutConfig = defaultTmpl.layoutConfig; }
        const merged = await mergeCompanyBrandingIntoLayout(
          company?.id ?? companyId,
          layoutConfig,
        );
        return NextResponse.json({
          success: true,
          data: {
            id: defaultTmpl.id,
            companyId: company?.id ?? companyId,
            layoutConfig: merged,
            templateId: defaultTmpl.id,
            templateName: defaultTmpl.name,
            version: defaultTmpl.version,
            isActive: defaultTmpl.isActive,
            source: "default_template",
          },
        });
      }
    } catch {
      // isDefault column may not exist yet (pre-migration) — fall through to 404
    }

    return NextResponse.json(
      { success: false, error: "No layout found for this company" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Error fetching layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch layout" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;
    const body = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    const {
      layoutConfig,
      referenceUrl,
      referenceFile,
      description,
      isActive,
      conversationId,
      createdBy,
      heroBannerUrl,
      footerImageUrl,
    } = body;

    if (!layoutConfig) {
      return NextResponse.json(
        { success: false, error: "layoutConfig is required" },
        { status: 400 },
      );
    }

    const company = await prisma.company.findUnique({ where: { id: companyId } });
    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    // Stringify config if it's an object
    const configString =
      typeof layoutConfig === "string"
        ? layoutConfig
        : JSON.stringify(layoutConfig);

    // ── Find or create the LayoutTemplate for this company ────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingBranding = await (prisma as any).brandingSettings.findUnique({
      where: { companyId },
      select: { layoutTemplateId: true },
    }) as { layoutTemplateId?: string | null } | null;

    let templateId: string;
    let templateName: string;
    let templateVersion: number;

    if (existingBranding?.layoutTemplateId) {
      // Update the existing assigned template in-place
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updated = await (prisma as any).layoutTemplate.update({
        where: { id: existingBranding.layoutTemplateId },
        data: {
          layoutConfig: configString,
          description: description || undefined,
          isActive: isActive !== undefined ? isActive : true,
          version: { increment: 1 },
        },
      });
      templateId = updated.id;
      templateName = updated.name;
      templateVersion = updated.version;
    } else {
      // Create a new LayoutTemplate named after the company and assign it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const created = await (prisma as any).layoutTemplate.create({
        data: {
          name: `${company.name} Layout`,
          description: description || `Layout for ${company.name}`,
          layoutConfig: configString,
          isActive: isActive !== undefined ? isActive : true,
          isDefault: false,
          conversationId: conversationId || null,
          createdBy: createdBy || null,
        },
      });
      templateId = created.id;
      templateName = created.name;
      templateVersion = created.version;

      // Assign the new template to this company
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).brandingSettings.upsert({
        where: { companyId },
        update: { layoutTemplateId: templateId },
        create: { companyId, layoutTemplateId: templateId },
      });
    }

    // Persist banner/footer image URLs to branding settings if provided
    if (heroBannerUrl || footerImageUrl) {
      await prisma.brandingSettings.upsert({
        where: { companyId },
        update: {
          ...(heroBannerUrl ? { heroBannerUrl } : {}),
          ...(footerImageUrl ? { footerImageUrl } : {}),
        },
        create: {
          companyId,
          heroBannerUrl: heroBannerUrl || null,
          footerImageUrl: footerImageUrl || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: templateId,
        companyId,
        templateId,
        templateName,
        version: templateVersion,
        isActive: isActive !== undefined ? isActive : true,
        layoutConfig: JSON.parse(configString),
        source: "layout_template",
        referenceUrl: referenceUrl || null,
        referenceFile: referenceFile || null,
        description: description || null,
      },
    });
  } catch (error) {
    console.error("Error saving layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save layout" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    // Unassign the template — we don't delete the template itself since it may
    // be reused or reassigned later.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branding = await (prisma as any).brandingSettings.findUnique({
      where: { companyId },
      select: { layoutTemplateId: true },
    }) as { layoutTemplateId?: string | null } | null;

    if (!branding?.layoutTemplateId) {
      return NextResponse.json(
        { success: false, error: "No layout template assigned to this company" },
        { status: 404 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).brandingSettings.update({
      where: { companyId },
      data: { layoutTemplateId: null },
    });

    return NextResponse.json({
      success: true,
      message: "Layout template unassigned from company",
    });
  } catch (error) {
    console.error("Error unassigning layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unassign layout" },
      { status: 500 },
    );
  }
}
