/**
 * Layout API
 * GET    /api/layouts/[companyId]?docType=quote - Fetch layout for a company + doc type
 * PUT    /api/layouts/[companyId]               - Save layout (docType in body, default "quote")
 * DELETE /api/layouts/[companyId]?docType=quote - Unassign the layout template
 *
 * Priority order for GET:
 *   docType=quote (default):
 *     1. CompanyDocumentLayout for (company, "quote")   [new path]
 *     2. BrandingSettings.layoutTemplateId              [legacy path, backward-compat]
 *     3. Global isDefault LayoutTemplate
 *     4. 404
 *   Other docTypes (review, payment, document_request):
 *     1. CompanyDocumentLayout for (company, docType)
 *     2. Global isDefault LayoutTemplate for that docType
 *     3. 404
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

/** Parse a layoutConfig string or return it as-is if already an object. */
function parseConfig(raw: unknown) {
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return raw; }
  }
  return raw;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const { companyId } = await params;
    const docType = new URL(request.url).searchParams.get("docType") || "quote";

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    const company = await resolveCompany(companyId);

    // ── Priority 1: CompanyDocumentLayout for this (company, docType) ────────
    if (company) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cdl = await (prisma as any).companyDocumentLayout.findUnique({
          where: { companyId_docType: { companyId: company.id, docType } },
          include: { template: true },
        });
        if (cdl?.template?.isActive) {
          const layoutConfig = parseConfig(cdl.template.layoutConfig);
          const merged = await mergeCompanyBrandingIntoLayout(company.id, layoutConfig);
          return NextResponse.json({
            success: true,
            data: {
              id: cdl.template.id, companyId: company.id,
              layoutConfig: merged, templateId: cdl.template.id,
              templateName: cdl.template.name, version: cdl.template.version,
              isActive: cdl.template.isActive, docType,
              source: "company_doc_layout",
            },
          });
        }
      } catch { /* table may not exist yet — fall through */ }
    }

    // ── Priority 2 (quote only): Legacy BrandingSettings.layoutTemplateId ────
    if (docType === "quote" && company) {
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
          if (tmpl?.isActive) {
            const layoutConfig = parseConfig(tmpl.layoutConfig);
            const merged = await mergeCompanyBrandingIntoLayout(company.id, layoutConfig);
            return NextResponse.json({
              success: true,
              data: {
                id: tmpl.id, companyId: company.id,
                layoutConfig: merged, templateId: tmpl.id,
                templateName: tmpl.name, version: tmpl.version,
                isActive: tmpl.isActive, docType: "quote",
                source: "layout_template",
              },
            });
          }
        }
      } catch { /* layoutTemplateId column may not exist yet */ }
    }

    // ── Priority 3: Global isDefault LayoutTemplate for this docType ─────────
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const defaultTmpl = await (prisma as any).layoutTemplate.findFirst({
        where: { isDefault: true, isActive: true, docType },
      });
      // Fallback for quote: find any isDefault template regardless of docType
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fallback = defaultTmpl ?? (docType === "quote" ? await (prisma as any).layoutTemplate.findFirst({
        where: { isDefault: true, isActive: true },
      }) : null);

      if (fallback) {
        const layoutConfig = parseConfig(fallback.layoutConfig);
        const merged = await mergeCompanyBrandingIntoLayout(company?.id ?? companyId, layoutConfig);
        return NextResponse.json({
          success: true,
          data: {
            id: fallback.id, companyId: company?.id ?? companyId,
            layoutConfig: merged, templateId: fallback.id,
            templateName: fallback.name, version: fallback.version,
            isActive: fallback.isActive, docType,
            source: "default_template",
          },
        });
      }
    } catch { /* isDefault column may not exist yet */ }

    return NextResponse.json(
      { success: false, error: `No layout found for this company (docType: ${docType})` },
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
      docType = "quote",
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

    let templateId: string;
    let templateName: string;
    let templateVersion: number;

    if (docType === "quote") {
      // ── Quote path: legacy BrandingSettings.layoutTemplateId ───────────────
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingBranding = await (prisma as any).brandingSettings.findUnique({
        where: { companyId },
        select: { layoutTemplateId: true },
      }) as { layoutTemplateId?: string | null } | null;

      if (existingBranding?.layoutTemplateId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updated = await (prisma as any).layoutTemplate.update({
          where: { id: existingBranding.layoutTemplateId },
          data: {
            layoutConfig: configString,
            description: description || undefined,
            isActive: isActive !== undefined ? isActive : true,
            docType: "quote",
            version: { increment: 1 },
          },
        });
        templateId = updated.id;
        templateName = updated.name;
        templateVersion = updated.version;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const created = await (prisma as any).layoutTemplate.create({
          data: {
            name: `${company.name} Layout`,
            description: description || `Layout for ${company.name}`,
            layoutConfig: configString,
            isActive: isActive !== undefined ? isActive : true,
            isDefault: false,
            docType: "quote",
            conversationId: conversationId || null,
            createdBy: createdBy || null,
          },
        });
        templateId = created.id;
        templateName = created.name;
        templateVersion = created.version;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).brandingSettings.upsert({
          where: { companyId },
          update: { layoutTemplateId: templateId },
          create: { companyId, layoutTemplateId: templateId },
        });
      }
    } else {
      // ── Non-quote path: CompanyDocumentLayout ──────────────────────────────
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await (prisma as any).companyDocumentLayout.findUnique({
          where: { companyId_docType: { companyId, docType } },
          include: { template: true },
        });

        if (existing?.templateId) {
          // Update the existing template in-place
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const updated = await (prisma as any).layoutTemplate.update({
            where: { id: existing.templateId },
            data: {
              layoutConfig: configString,
              description: description || undefined,
              isActive: isActive !== undefined ? isActive : true,
              docType,
              version: { increment: 1 },
            },
          });
          templateId = updated.id;
          templateName = updated.name;
          templateVersion = updated.version;
        } else {
          // Create a new template and link it via CompanyDocumentLayout
          const docTypeLabel = docType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const created = await (prisma as any).layoutTemplate.create({
            data: {
              name: `${company.name} — ${docTypeLabel}`,
              description: description || `${docTypeLabel} layout for ${company.name}`,
              layoutConfig: configString,
              isActive: isActive !== undefined ? isActive : true,
              isDefault: false,
              docType,
              conversationId: conversationId || null,
              createdBy: createdBy || null,
            },
          });
          templateId = created.id;
          templateName = created.name;
          templateVersion = created.version;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (prisma as any).companyDocumentLayout.upsert({
            where: { companyId_docType: { companyId, docType } },
            update: { templateId, isActive: true },
            create: { companyId, docType, templateId, isActive: true },
          });
        }
      } catch (e) {
        console.error("[layouts/PUT] companyDocumentLayout error:", e);
        throw e;
      }
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
        docType,
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
    const docType = new URL(request.url).searchParams.get("docType") || "quote";

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "Company ID is required" },
        { status: 400 },
      );
    }

    if (docType === "quote") {
      // Legacy quote path — unassign from BrandingSettings
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
    } else {
      // Non-quote — delete the CompanyDocumentLayout row
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).companyDocumentLayout.delete({
          where: { companyId_docType: { companyId, docType } },
        });
      } catch {
        return NextResponse.json(
          { success: false, error: `No ${docType} layout assigned to this company` },
          { status: 404 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${docType} layout template unassigned from company`,
    });
  } catch (error) {
    console.error("Error unassigning layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unassign layout" },
      { status: 500 },
    );
  }
}
