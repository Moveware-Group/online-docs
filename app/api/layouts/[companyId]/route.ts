/**
 * Custom Layout CRUD API
 * GET    /api/layouts/[companyId] - Fetch layout for a company
 * PUT    /api/layouts/[companyId] - Create or update layout for a company
 * DELETE /api/layouts/[companyId] - Delete layout for a company
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GRACE_STATIC_LAYOUT } from "@/lib/layouts/grace-static";

/** Merge company branding fontFamily into layout config globalStyles */
async function mergeCompanyFontIntoLayout(
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
    const fontFamily = company?.brandingSettings?.fontFamily;
    if (!fontFamily) return layoutConfig;
    return {
      ...layoutConfig,
      globalStyles: {
        ...layoutConfig.globalStyles,
        fontFamily,
      },
    };
  } catch {
    return layoutConfig;
  }
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

    // Temporary static fallback for Grace company while AI layout builder is being stabilised.
    // Force static for known Grace coIds even if a custom AI layout exists.
    const forceGraceStatic = companyId === "555" || isGraceCompany(resolvedCompany);
    if (forceGraceStatic) {
      const layoutConfig = buildGraceStaticLayoutConfig();
      const merged = await mergeCompanyFontIntoLayout(resolvedCompany?.id ?? companyId, layoutConfig);
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

    const mergedConfig = await mergeCompanyFontIntoLayout(resolvedCompany?.id ?? companyId, layoutConfig);

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
