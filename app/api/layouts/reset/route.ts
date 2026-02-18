/**
 * POST /api/layouts/reset
 *
 * Removes a company's saved custom layout so that the Layout Template
 * assigned to them in Settings takes over on the next page load.
 *
 * Body: { companyId: string }
 *
 * Use-case: when the underlying template has been updated and a company's
 * stale DB-saved layout needs to be cleared so it picks up the latest
 * template automatically via the normal GET priority chain:
 *   1. Assigned Layout Template  →  2. Saved CustomLayout  →  3. 404 (default)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    const existing = await prisma.customLayout.findUnique({
      where: { companyId: company.id },
    });

    if (!existing) {
      return NextResponse.json({
        success: true,
        message: `No saved layout found for "${company.name}" — already using the assigned template.`,
      });
    }

    await prisma.customLayout.delete({ where: { companyId: company.id } });

    return NextResponse.json({
      success: true,
      message: `Custom layout for "${company.name}" removed. The assigned template will now be used.`,
    });
  } catch (error) {
    console.error("Error resetting layout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset layout" },
      { status: 500 },
    );
  }
}
