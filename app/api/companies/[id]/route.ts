/**
 * Company Detail API Route
 * GET /api/companies/[id] - Fetch single company with tenant filtering
 * PUT /api/companies/[id] - Update company with tenant authorization
 * DELETE /api/companies/[id] - Delete company with cascade cleanup
 *
 * This endpoint provides tenant-isolated access to a specific company.
 * Users can only access companies belonging to their tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { azureStorageService } from "@/lib/services/azureStorage";

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

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.company_name || typeof body.company_name !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "company_name is required and must be a string",
        },
        { status: 400 },
      );
    }

    if (!body.brand_code || typeof body.brand_code !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "brand_code is required and must be a string",
        },
        { status: 400 },
      );
    }

    // Validate company_name length
    if (body.company_name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "company_name cannot be empty",
        },
        { status: 400 },
      );
    }

    if (body.company_name.length > 255) {
      return NextResponse.json(
        {
          success: false,
          error: "company_name must not exceed 255 characters",
        },
        { status: 400 },
      );
    }

    // Validate brand_code format and length
    const brandCodeRegex = /^[a-zA-Z0-9_-]+$/;
    if (!brandCodeRegex.test(body.brand_code)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "brand_code must contain only alphanumeric characters, underscores, and hyphens",
        },
        { status: 400 },
      );
    }

    if (body.brand_code.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "brand_code must not exceed 50 characters",
        },
        { status: 400 },
      );
    }

    // Validate color formats if provided
    const hexColorRegex = /^#([A-Fa-f0-9]{6})$/;

    if (body.primary_color && !hexColorRegex.test(body.primary_color)) {
      return NextResponse.json(
        {
          success: false,
          error: "primary_color must be a valid hex color (e.g., #2563eb)",
        },
        { status: 400 },
      );
    }

    if (body.secondary_color && !hexColorRegex.test(body.secondary_color)) {
      return NextResponse.json(
        {
          success: false,
          error: "secondary_color must be a valid hex color (e.g., #1e40af)",
        },
        { status: 400 },
      );
    }

    if (body.tertiary_color && !hexColorRegex.test(body.tertiary_color)) {
      return NextResponse.json(
        {
          success: false,
          error: "tertiary_color must be a valid hex color (e.g., #60a5fa)",
        },
        { status: 400 },
      );
    }

    // Validate logo_url length if provided
    if (body.logo_url && body.logo_url.length > 500) {
      return NextResponse.json(
        {
          success: false,
          error: "logo_url must not exceed 500 characters",
        },
        { status: 400 },
      );
    }

    // Validate content field lengths if provided
    if (body.hero_content && body.hero_content.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error: "hero_content must not exceed 5000 characters",
        },
        { status: 400 },
      );
    }

    if (body.copy_content && body.copy_content.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          error: "copy_content must not exceed 5000 characters",
        },
        { status: 400 },
      );
    }

    // Verify company exists and belongs to tenant
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
          error: "Company not found",
        },
        { status: 404 },
      );
    }

    // Check for duplicate brand_code within tenant (excluding current company)
    const duplicateBrandCode = await prisma.company.findFirst({
      where: {
        tenantId: tenantId.trim(),
        brandCode: body.brand_code.trim(),
        id: {
          not: id.trim(),
        },
      },
    });

    if (duplicateBrandCode) {
      return NextResponse.json(
        {
          success: false,
          error: `brand_code '${body.brand_code}' is already in use within this tenant`,
        },
        { status: 409 },
      );
    }

    // Build update data
    const updateData: any = {
      name: body.company_name.trim(),
      brandCode: body.brand_code.trim(),
      updatedAt: new Date(),
    };

    // Add optional fields if provided
    if (body.primary_color !== undefined) {
      updateData.primaryColor = body.primary_color;
    }
    if (body.secondary_color !== undefined) {
      updateData.secondaryColor = body.secondary_color;
    }
    if (body.tertiary_color !== undefined) {
      updateData.tertiaryColor = body.tertiary_color;
    }
    if (body.logo_url !== undefined) {
      updateData.logoUrl = body.logo_url;
    }
    if (body.hero_content !== undefined) {
      updateData.heroContent = body.hero_content;
    }
    if (body.copy_content !== undefined) {
      updateData.copyContent = body.copy_content;
    }

    // Update company in database
    try {
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
    } catch (updateError) {
      // Handle unique constraint violations
      if (
        updateError instanceof Prisma.PrismaClientKnownRequestError &&
        updateError.code === "P2002"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "A company with this brand_code already exists",
          },
          { status: 409 },
        );
      }
      throw updateError;
    }
  } catch (error) {
    console.error("Error updating company:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 },
      );
    }

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

/**
 * DELETE /api/companies/[id]
 * Delete a company with tenant authorization and cascade cleanup
 *
 * Headers:
 * - X-Tenant-Id: Tenant ID for authorization (required)
 * - Authorization: Bearer token (required)
 *
 * Returns:
 * - 204: Successfully deleted (no content)
 * - 401: Unauthorized
 * - 404: Company not found or unauthorized
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
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
    // Also retrieve logo_url for cleanup
    const company = await prisma.company.findFirst({
      where: {
        id: id.trim(),
        tenantId: tenantId.trim(),
      },
      select: {
        id: true,
        logoUrl: true,
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

    // Delete company logo from Azure Blob Storage if exists
    if (company.logoUrl) {
      try {
        const blobName = azureStorageService.extractBlobNameFromUrl(
          company.logoUrl,
        );
        if (blobName) {
          const deleteResult = await azureStorageService.deleteFile(blobName);
          if (deleteResult.success) {
            console.log(
              `✓ Deleted logo for company ${company.id}: ${blobName}`,
            );
          } else {
            console.warn(
              `⚠️ Failed to delete logo for company ${company.id}: ${deleteResult.error}`,
            );
          }
        }
      } catch (logoError) {
        // Log error but don't fail the deletion
        console.error(
          `Error deleting logo for company ${company.id}:`,
          logoError,
        );
      }
    }

    // Delete company from database
    await prisma.company.delete({
      where: { id: company.id },
    });

    console.log(`✓ Company ${company.id} deleted successfully`);

    // Return 204 No Content on success
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting company:", error);

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
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete company. Please try again later.",
      },
      { status: 500 },
    );
  }
}
