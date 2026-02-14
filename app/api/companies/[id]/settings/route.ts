import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import {
  GetCompanySettingsResponse,
  UpdateCompanyColorsRequest,
  UpdateCompanyColorsResponse,
} from "@/lib/types/company";

/**
 * GET /api/companies/[id]/settings
 * Fetch company branding settings
 *
 * Authorization: Requires admin role and company access
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: companyId } = await params;

    // Verify authentication and authorization
    const authError = await requireAdmin(request, companyId);
    if (authError) {
      return NextResponse.json<GetCompanySettingsResponse>(
        { success: false, error: authError.error },
        { status: authError.status },
      );
    }

    // Fetch branding settings from database
    const branding = await prisma.brandingSettings.findUnique({
      where: { companyId },
    });

    if (!branding) {
      // Return default settings if none exist
      return NextResponse.json<GetCompanySettingsResponse>(
        {
          success: true,
          data: {
            logoUrl: null,
            primaryColor: "#2563eb",
            secondaryColor: "#1e40af",
            fontFamily: "Inter",
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json<GetCompanySettingsResponse>(
      {
        success: true,
        data: {
          logoUrl: branding.logoUrl,
          primaryColor: branding.primaryColor || "#2563eb",
          secondaryColor: branding.secondaryColor || "#1e40af",
          fontFamily: branding.fontFamily || "Inter",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching company settings:", error);
    return NextResponse.json<GetCompanySettingsResponse>(
      {
        success: false,
        error: "Failed to fetch company settings",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/companies/[id]/settings
 * Update company color settings
 *
 * Authorization: Requires admin role and company access
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: companyId } = await params;

    // Verify authentication and authorization
    const authError = await requireAdmin(request, companyId);
    if (authError) {
      return NextResponse.json<UpdateCompanyColorsResponse>(
        { success: false, error: authError.error },
        { status: authError.status },
      );
    }

    // Parse request body
    const body: UpdateCompanyColorsRequest = await request.json();
    const { primaryColor, secondaryColor } = body;

    // Validate that at least one color is provided
    if (!primaryColor && !secondaryColor) {
      return NextResponse.json<UpdateCompanyColorsResponse>(
        {
          success: false,
          error:
            "At least one color (primaryColor or secondaryColor) must be provided",
        },
        { status: 400 },
      );
    }

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return NextResponse.json<UpdateCompanyColorsResponse>(
        {
          success: false,
          error: "Primary color must be a valid hex color (e.g., #2563eb)",
        },
        { status: 400 },
      );
    }

    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return NextResponse.json<UpdateCompanyColorsResponse>(
        {
          success: false,
          error: "Secondary color must be a valid hex color (e.g., #1e40af)",
        },
        { status: 400 },
      );
    }

    // Build update data
    const updateData: any = {};
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;

    // Update or create branding settings
    const branding = await prisma.brandingSettings.upsert({
      where: { companyId },
      update: updateData,
      create: {
        companyId,
        primaryColor: primaryColor || "#2563eb",
        secondaryColor: secondaryColor || "#1e40af",
        fontFamily: "Inter",
        logoUrl: null,
      },
    });

    return NextResponse.json<UpdateCompanyColorsResponse>(
      {
        success: true,
        data: {
          logoUrl: branding.logoUrl,
          primaryColor: branding.primaryColor || "#2563eb",
          secondaryColor: branding.secondaryColor || "#1e40af",
          fontFamily: branding.fontFamily || "Inter",
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating company colors:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<UpdateCompanyColorsResponse>(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      );
    }

    return NextResponse.json<UpdateCompanyColorsResponse>(
      {
        success: false,
        error: "Failed to update company colors",
      },
      { status: 500 },
    );
  }
}
