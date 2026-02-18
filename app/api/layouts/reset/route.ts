/**
 * POST /api/layouts/reset
 *
 * Resets a company's saved layout to the latest built-in static template.
 * Body: { companyId: string }
 *
 * Why this exists:
 *   Company layouts are saved as JSON blobs in the database.  When the static
 *   grace-static.ts template is updated (e.g. container widths, block HTML)
 *   those changes are NOT automatically propagated to already-saved company
 *   layouts.  This endpoint overwrites the saved layout with a fresh copy of
 *   the current static template so the company immediately picks up the latest
 *   structure.  Company-specific branding (hero banner, footer image, colours)
 *   is preserved via mergeCompanyBrandingIntoLayout on the next GET request.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GRACE_STATIC_LAYOUT } from "@/lib/layouts/grace-static";

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "companyId is required" },
        { status: 400 },
      );
    }

    // Resolve internal company ID (caller may pass tenantId / coId)
    const company = await prisma.company.findFirst({
      where: { OR: [{ id: companyId }, { tenantId: companyId }] },
      select: { id: true, name: true },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    const configString = JSON.stringify(GRACE_STATIC_LAYOUT);

    const layout = await prisma.customLayout.upsert({
      where: { companyId: company.id },
      update: {
        layoutConfig: configString,
        isActive: true,
        version: { increment: 1 },
        description: "Reset to latest grace template",
      },
      create: {
        companyId: company.id,
        layoutConfig: configString,
        isActive: true,
        description: "Reset to latest grace template",
      },
    });

    return NextResponse.json({
      success: true,
      data: { id: layout.id, companyId: layout.companyId, version: layout.version },
      message: `Layout for "${company.name}" reset to latest template (v${layout.version})`,
    });
  } catch (error) {
    console.error("Error resetting layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset layout" },
      { status: 500 },
    );
  }
}
