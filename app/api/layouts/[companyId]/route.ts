/**
 * Custom Layout CRUD API
 * GET    /api/layouts/[companyId] - Fetch layout for a company
 * PUT    /api/layouts/[companyId] - Create or update layout for a company
 * DELETE /api/layouts/[companyId] - Delete layout for a company
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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

    // Try to find layout by internal company ID first, then by tenant ID (coId from URL)
    let layout = await prisma.customLayout.findUnique({
      where: { companyId },
      include: {
        company: {
          select: { name: true, brandCode: true, tenantId: true },
        },
      },
    });

    // If not found by internal ID, try looking up by tenant ID (e.g. coId=12 from the quote page URL)
    if (!layout) {
      const company = await prisma.company.findFirst({
        where: { tenantId: companyId },
      });
      if (company) {
        layout = await prisma.customLayout.findUnique({
          where: { companyId: company.id },
          include: {
            company: {
              select: { name: true, brandCode: true, tenantId: true },
            },
          },
        });
      }
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

    return NextResponse.json({
      success: true,
      data: {
        ...layout,
        layoutConfig,
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
