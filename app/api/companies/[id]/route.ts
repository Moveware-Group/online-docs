/**
 * Company Detail API Route
 * GET /api/companies/[id] - Fetch single company with tenant filtering
 * PUT /api/companies/[id] - Update company with tenant authorization
 *
 * This endpoint provides tenant-isolated access to a specific company.
 * Users can only access companies belonging to their tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

interface GetCompanyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface UpdateCompanyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * GET /api/companies/[id]
 * Retrieve a single company by ID, filtered by tenant ID
 *
 * Headers:
 * - X-Tenant-Id: Tenant ID for filtering (required)
 * - Authorization: Bearer token (required)
 *
 * Returns:
 * - 200: Company object with all fields
 * - 401: Unauthorized (missing tenant ID or auth token)
 * - 404: Company not found or belongs to different tenant
 * - 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<GetCompanyResponse>> {
  try {
    // Extract company ID from path parameter
    const { id } = await params;

    // Validate company ID parameter
    if (!id || id.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Company ID is required",
        },
        { status: 400 },
      );
    }

    // Extract tenant ID from request headers
    const tenantId = request.headers.get("X-Tenant-Id");

    // Check authentication - require tenant ID
    if (!tenantId || tenantId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Tenant ID is required",
        },
        { status: 401 },
      );
    }

    // Verify authorization header exists
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Valid authentication token is required",
        },
        { status: 401 },
      );
    }

    // Query company by ID AND tenant ID to ensure tenant isolation
    const company = await prisma.company.findFirst({
      where: {
        id: id.trim(),
        tenantId: tenantId.trim(),
      },
    });

    // Return 404 if company doesn't exist or belongs to different tenant
    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found",
        },
        { status: 404 },
      );
    }

    // Return company object with all fields
    return NextResponse.json(
      {
        success: true,
        data: company,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching company:", error);

    // Handle Prisma-specific errors
    if (error instanceof Error) {
      // Database connection errors
      if (
        error.message.includes("connect") ||
        error.message.includes("database")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Database connection error. Please try again later.",
          },
          { status: 503 },
        );
      }

      // Query errors
      if (
        error.message.includes("query") ||
        error.message.includes("invalid")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid query parameters",
          },
          { status: 400 },
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch company. Please try again later.",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/companies/[id]
 * Update an existing company with tenant scoping and validation
 *
 * Request body:
 * - company_name: string (required, max 255 chars)
 * - brand_code: string (required, alphanumeric + underscore/hyphen, max 50 chars)
 * - primary_color: string (optional, hex format #RRGGBB)
 * - secondary_color: string (optional, hex format #RRGGBB)
 * - tertiary_color: string (optional, hex format #RRGGBB)
 * - logo_url: string (optional, max 500 chars)
 * - hero_content: string (optional, max 5000 chars)
 * - copy_content: string (optional, max 5000 chars)
 *
 * Headers:
 * - X-Tenant-Id: Tenant ID for authorization (required)
 * - Authorization: Bearer token (required)
 *
 * Returns:
 * - 200: Updated company object
 * - 400: Validation error
 * - 401: Unauthorized
 * - 404: Company not found or unauthorized
 * - 409: Duplicate brand_code within tenant
 * - 500: Internal server error
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<UpdateCompanyResponse>> {
  try {
    // Extract company ID from path parameter
    const { id } = await params;

    // Validate company ID parameter
    if (!id || id.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Company ID is required",
        },
        { status: 400 },
      );
    }

    // Extract tenant ID from request headers
    const tenantId = request.headers.get("X-Tenant-Id");

    // Check authentication - require tenant ID
    if (!tenantId || tenantId.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Tenant ID is required",
        },
        { status: 401 },
      );
    }

    // Verify authorization header exists
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Valid authentication token is required",
        },
        { status: 401 },
      );
    }

    // Verify company exists and belongs to current tenant
    const existingCompany = await prisma.company.findFirst({
      where: {
        id: id.trim(),
        tenantId: tenantId.trim(),
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found or unauthorized",
        },
        { status: 404 },
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      );
    }

    const {
      company_name,
      brand_code,
      primary_color,
      secondary_color,
      tertiary_color,
      logo_url,
      hero_content,
      copy_content,
    } = body;

    // Validate required fields
    if (
      !company_name ||
      typeof company_name !== "string" ||
      company_name.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Company name is required and must be a non-empty string",
        },
        { status: 400 },
      );
    }

    if (
      !brand_code ||
      typeof brand_code !== "string" ||
      brand_code.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Brand code is required and must be a non-empty string",
        },
        { status: 400 },
      );
    }

    // Validate field lengths
    if (company_name.trim().length > 255) {
      return NextResponse.json(
        {
          success: false,
          error: "Company name must be 255 characters or less",
        },
        { status: 400 },
      );
    }

    if (brand_code.trim().length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Brand code must be 50 characters or less",
        },
        { status: 400 },
      );
    }

    // Validate brand_code format (alphanumeric, underscore, hyphen only)
    const brandCodeRegex = /^[a-zA-Z0-9_-]+$/;
    if (!brandCodeRegex.test(brand_code.trim())) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brand code must contain only alphanumeric characters, underscores, and hyphens",
        },
        { status: 400 },
      );
    }

    // Validate hex color formats
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (primary_color && !hexColorRegex.test(primary_color)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Primary color must be a valid hex color (e.g., #2563eb or #fff)",
        },
        { status: 400 },
      );
    }

    if (secondary_color && !hexColorRegex.test(secondary_color)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Secondary color must be a valid hex color (e.g., #1e40af or #000)",
        },
        { status: 400 },
      );
    }

    if (tertiary_color && !hexColorRegex.test(tertiary_color)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Tertiary color must be a valid hex color (e.g., #60a5fa or #aaa)",
        },
        { status: 400 },
      );
    }

    // Validate optional field lengths
    if (logo_url && logo_url.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "Logo URL must be 500 characters or less",
        },
        { status: 400 },
      );
    }

    if (hero_content && hero_content.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error: "Hero content must be 5000 characters or less",
        },
        { status: 400 },
      );
    }

    if (copy_content && copy_content.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error: "Copy content must be 5000 characters or less",
        },
        { status: 400 },
      );
    }

    // Check for duplicate brand_code within tenant (excluding current company)
    const duplicateCheck = await prisma.company.findFirst({
      where: {
        tenantId: tenantId.trim(),
        brandCode: brand_code.trim(),
        id: {
          not: id.trim(),
        },
      },
    });

    if (duplicateCheck) {
      return NextResponse.json(
        {
          success: false,
          error: `A company with brand code '${brand_code.trim()}' already exists in this tenant`,
        },
        { status: 409 },
      );
    }

    // Build update data object
    const updateData: any = {
      name: company_name.trim(),
      brandCode: brand_code.trim(),
    };

    // Add optional fields if provided
    if (primary_color !== undefined) {
      updateData.primaryColor = primary_color || "#2563eb";
    }
    if (secondary_color !== undefined) {
      updateData.secondaryColor = secondary_color || "#1e40af";
    }
    if (tertiary_color !== undefined) {
      updateData.tertiaryColor = tertiary_color || "#60a5fa";
    }
    if (logo_url !== undefined) {
      updateData.logoUrl = logo_url || null;
      // NOTE: Old logo file cleanup is handled in a separate task (OD-XXX)
      // When logo_url changes, the old logo file should be marked for deletion
      // but is not deleted in this endpoint
    }
    if (hero_content !== undefined) {
      updateData.heroContent = hero_content || null;
    }
    if (copy_content !== undefined) {
      updateData.copyContent = copy_content || null;
    }

    // Update company record
    const updatedCompany = await prisma.company.update({
      where: {
        id: id.trim(),
      },
      data: updateData,
    });

    // Return updated company object
    return NextResponse.json(
      {
        success: true,
        data: updatedCompany,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating company:", error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // P2002: Unique constraint violation (shouldn't happen due to pre-check, but handle anyway)
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            error:
              "A company with this brand code already exists in this tenant",
          },
          { status: 409 },
        );
      }

      // P2025: Record not found
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            error: "Company not found",
          },
          { status: 404 },
        );
      }
    }

    // Handle generic errors
    if (error instanceof Error) {
      // Database connection errors
      if (
        error.message.includes("connect") ||
        error.message.includes("database")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Database connection error. Please try again later.",
          },
          { status: 503 },
        );
      }

      // Query errors
      if (
        error.message.includes("query") ||
        error.message.includes("invalid")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid query parameters",
          },
          { status: 400 },
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update company. Please try again later.",
      },
      { status: 500 },
    );
  }
}
