/**
 * Company Detail API
 * GET /api/companies/[id] - Get company details
 * PUT /api/companies/[id] - Update company
 * DELETE /api/companies/[id] - Delete company
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/companies/[id]
 * Fetch company details with settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    // Fetch related settings separately (relations are not defined on Company in schema)
    const [brandingSettings, heroSettings, copySettings] = await Promise.all([
      prisma.brandingSettings.findUnique({ where: { companyId: id } }),
      prisma.heroSettings.findUnique({ where: { companyId: id } }),
      prisma.copySettings.findUnique({ where: { companyId: id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...company,
        brandingSettings,
        heroSettings,
        copySettings,
      },
    });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch company" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/companies/[id]
 * Update company details
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: body.name,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: company,
    });
  } catch (error) {
    console.error("Error updating company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update company" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/companies/[id]
 * Delete a company
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting company:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete company" },
      { status: 500 },
    );
  }
}
