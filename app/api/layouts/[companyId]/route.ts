/**
 * Custom Layout CRUD API
 * GET    /api/layouts/[companyId] - Fetch layout for a company
 * PUT    /api/layouts/[companyId] - Create or update layout for a company
 * DELETE /api/layouts/[companyId] - Delete layout for a company
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GRACE_STATIC_LAYOUT } from "@/lib/layouts/grace-static";

/** Merge company branding (font, hero banner, footer image) into layout config globalStyles */
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

/** @deprecated Use mergeCompanyBrandingIntoLayout */
async function mergeCompanyFontIntoLayout(
  companyId: string,
  layoutConfig: { globalStyles?: Record<string, string> }
): Promise<typeof layoutConfig> {
  return mergeCompanyBrandingIntoLayout(companyId, layoutConfig);
}

function isGraceCompany(company: { tenantId?: string | null; brandCode?: string | null; name?: string | null } | null): boolean {
  if (!company) return false;
  const tenantId = (company.tenantId || "").toLowerCase();
  const brandCode = (company.brandCode || "").toLowerCase();
  const name = (company.name || "").toLowerCase();
  return (
    tenantId === "555" ||
    tenantId === "55580" ||
    tenantId === "67200" ||
    brandCode.includes("grace") ||
    name.includes("grace")
  );
}

function buildGraceStaticLayoutConfig() {
  return GRACE_STATIC_LAYOUT;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;
    let resolvedCompany: {
      id: string;
      name: string;
      brandCode: string;
      tenantId: string;
    } | null = null;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    // Try to find layout by internal company ID first, then by tenant ID (coId from URL)
    let layout = await prisma.customLayout.findUnique({
      where: { companyId },
      include: {
        company: {
          select: { id: true, name: true, brandCode: true, tenantId: true },
        },
      },
    });
    if (layout?.company) {
      resolvedCompany = layout.company;
    }

    // If not found by internal ID, try looking up by tenant ID (e.g. coId=12 from the quote page URL)
    if (!layout) {
      const company = await prisma.company.findFirst({
        where: {
          OR: [{ id: companyId }, { tenantId: companyId }],
        },
        select: {
          id: true,
          name: true,
          brandCode: true,
          tenantId: true,
        },
      });
      resolvedCompany = company;
      if (company) {
        layout = await prisma.customLayout.findUnique({
          where: { companyId: company.id },
          include: {
            company: {
              select: { id: true, name: true, brandCode: true, tenantId: true },
            },
          },
        });
        if (layout?.company) {
          resolvedCompany = layout.company;
        }
      }
    }

    // ── Priority 1: Check if company has a LayoutTemplate assigned in BrandingSettings ──
    const resolvedInternalId = resolvedCompany?.id;
    if (resolvedInternalId) {
      try {
        const branding = await prisma.brandingSettings.findUnique({
          where: { companyId: resolvedInternalId },
          select: { layoutTemplateId: true } as never,
        }) as { layoutTemplateId?: string | null } | null;

        if (branding?.layoutTemplateId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tmpl = await (prisma as any).layoutTemplate.findUnique({
            where: { id: branding.layoutTemplateId },
          });
          if (tmpl && tmpl.isActive) {
            let layoutConfig;
            try { layoutConfig = JSON.parse(tmpl.layoutConfig); } catch { layoutConfig = tmpl.layoutConfig; }
            const merged = await mergeCompanyBrandingIntoLayout(resolvedInternalId, layoutConfig);
            return NextResponse.json({
              success: true,
              data: {
                id: tmpl.id,
                companyId: resolvedInternalId,
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

    // ── Priority 2: Company-specific CustomLayout ──
    // For Grace companies: use their saved layout if one exists in the DB;
    // otherwise fall back to the built-in static template.
    const isGrace = companyId === "555" || isGraceCompany(resolvedCompany);
    if (isGrace && !layout) {
      const layoutConfig = buildGraceStaticLayoutConfig();
      const merged = await mergeCompanyBrandingIntoLayout(resolvedCompany?.id ?? companyId, layoutConfig);
      return NextResponse.json({
        success: true,
        data: {
          id: `static-grace-${resolvedCompany?.id || companyId}`,
          companyId: resolvedCompany?.id || companyId,
          layoutConfig: merged,
          version: 1,
          isActive: true,
          source: "static_fallback",
        },
      });
    }

    if (!layout) {
      return NextResponse.json(
        { success: false, error: "No custom layout found for this company" },
        { status: 404 },
      );
    }

    // Parse the JSON config
    let layoutConfig;
    try {
      layoutConfig = JSON.parse(layout.layoutConfig);
    } catch {
      layoutConfig = layout.layoutConfig;
    }

    const mergedConfig = await mergeCompanyBrandingIntoLayout(resolvedCompany?.id ?? companyId, layoutConfig);

    return NextResponse.json({
      success: true,
      data: {
        ...layout,
        layoutConfig: mergedConfig,
      },
    });
  } catch (error) {
    console.error("Error fetching custom layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch custom layout" },
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

    // Verify the company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    // If banner/footer image URLs provided, persist them to branding settings
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

    // Stringify config if it's an object
    const configString =
      typeof layoutConfig === "string"
        ? layoutConfig
        : JSON.stringify(layoutConfig);

    // Upsert the layout
    const layout = await prisma.customLayout.upsert({
      where: { companyId },
      update: {
        layoutConfig: configString,
        referenceUrl: referenceUrl || undefined,
        referenceFile: referenceFile || undefined,
        description: description || undefined,
        isActive: isActive !== undefined ? isActive : true,
        conversationId: conversationId || undefined,
        createdBy: createdBy || undefined,
        version: { increment: 1 },
      },
      create: {
        companyId,
        layoutConfig: configString,
        referenceUrl: referenceUrl || null,
        referenceFile: referenceFile || null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        conversationId: conversationId || null,
        createdBy: createdBy || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...layout,
        layoutConfig: JSON.parse(layout.layoutConfig),
      },
    });
  } catch (error) {
    console.error("Error saving custom layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save custom layout" },
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

    const existing = await prisma.customLayout.findUnique({
      where: { companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "No custom layout found for this company" },
        { status: 404 },
      );
    }

    await prisma.customLayout.delete({ where: { companyId } });

    return NextResponse.json({
      success: true,
      message: "Custom layout deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting custom layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete custom layout" },
      { status: 500 },
    );
  }
}
