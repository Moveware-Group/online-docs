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
import {
  validateCompanyName,
  validateBrandCode,
  validateColor,
  validateLogoUrl,
  validateTextContent,
  formatValidationErrors,
  type ValidationError,
} from "@/lib/validations/company";

interface GetCompanyResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface UpdateCompanyResponse {
  success: boolean;
  data?: any;
  error?: string;
  fields?: Record<string, string>;
}

interface DeleteCompanyResponse {
  success: boolean;
  message?: string;
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
 * - 400: Validation error with field-specific messages
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
          error: "Company not found or unauthorized",
        },
        { status: 404 },
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
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

    // Collect all validation errors
    const allErrors: ValidationError[] = [];

    // Validate company name if provided
    if (company_name !== undefined) {
      const nameResult = validateCompanyName(company_name);
      allErrors.push(...nameResult.errors);
    }

    // Validate brand code if provided
    if (brand_code !== undefined) {
      const brandCodeResult = validateBrandCode(brand_code);
      allErrors.push(...brandCodeResult.errors);
    }

    // Validate colors if provided
    if (primary_color !== undefined) {
      const primaryColorResult = validateColor(primary_color, "primary_color");
      allErrors.push(...primaryColorResult.errors);
    }

    if (secondary_color !== undefined) {
      const secondaryColorResult = validateColor(
        secondary_color,
        "secondary_color",
      );
      allErrors.push(...secondaryColorResult.errors);
    }

    if (tertiary_color !== undefined) {
      const tertiaryColorResult = validateColor(
        tertiary_color,
        "tertiary_color",
      );
      allErrors.push(...tertiaryColorResult.errors);
    }

    // Validate logo URL if provided
    if (logo_url !== undefined) {
      const logoUrlResult = validateLogoUrl(logo_url);
      allErrors.push(...logoUrlResult.errors);
    }

    // Validate text content if provided
    if (hero_content !== undefined) {
      const heroContentResult = validateTextContent(
        hero_content,
        "hero_content",
      );
      allErrors.push(...heroContentResult.errors);
    }

    if (copy_content !== undefined) {
      const copyContentResult = validateTextContent(
        copy_content,
        "copy_content",
      );
      allErrors.push(...copyContentResult.errors);
    }

    // Return validation errors if any
    if (allErrors.length > 0) {
      const formattedErrors = formatValidationErrors(allErrors);
      return NextResponse.json(
        {
          success: false,
          error: formattedErrors.message,
          fields: formattedErrors.fields,
        },
        { status: 400 },
      );
    }

    // Check for duplicate brand_code within tenant (if brand_code is being updated)
    if (brand_code && brand_code.trim() !== existingCompany.brandCode) {
      const duplicateCompany = await prisma.company.findFirst({
        where: {
          tenantId: tenantId.trim(),
          brandCode: {
            equals: brand_code.trim(),
            mode: "insensitive",
          },
          id: {
            not: id.trim(),
          },
        },
      });

      if (duplicateCompany) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A company with this brand code already exists in your tenant",
            fields: {
              brand_code:
                "A company with this brand code already exists in your tenant",
            },
          },
          { status: 409 },
        );
      }
    }

    // Build update data object (only include fields that are provided)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (company_name !== undefined)
      updateData.name = company_name.trim() || null;
    if (brand_code !== undefined)
      updateData.brandCode = brand_code.trim() || null;
    if (primary_color !== undefined)
      updateData.primaryColor = primary_color?.trim() || null;
    if (secondary_color !== undefined)
      updateData.secondaryColor = secondary_color?.trim() || null;
    if (tertiary_color !== undefined)
      updateData.tertiaryColor = tertiary_color?.trim() || null;
    if (logo_url !== undefined) updateData.logoUrl = logo_url?.trim() || null;
    if (hero_content !== undefined)
      updateData.heroContent = hero_content?.trim() || null;
    if (copy_content !== undefined)
      updateData.copyContent = copy_content?.trim() || null;

    // Update company
    const updatedCompany = await prisma.company.update({
      where: {
        id: id.trim(),
      },
      data: updateData,
    });

    console.log(`✓ Company updated successfully: ${updatedCompany.id}`);

    // Return updated company
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
      // Unique constraint violation
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            error: "A company with this brand code already exists",
            fields: {
              brand_code: "A company with this brand code already exists",
            },
          },
          { status: 409 },
        );
      }

      // Record not found
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

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    // Handle general errors
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
 * Delete a company and its associated data (cascade cleanup)
 *
 * Headers:
 * - X-Tenant-Id: Tenant ID for authorization (required)
 * - Authorization: Bearer token (required)
 *
 * Returns:
 * - 200: Company deleted successfully
 * - 401: Unauthorized
 * - 404: Company not found or unauthorized
 * - 500: Internal server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<DeleteCompanyResponse>> {
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

    // Verify company exists and belongs to tenant
    const company = await prisma.company.findFirst({
      where: {
        id: id.trim(),
        tenantId: tenantId.trim(),
      },
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: "Company not found or unauthorized",
        },
        { status: 404 },
      );
    }

    // Delete logo from Azure Storage if exists
    if (company.logoUrl) {
      const blobName = azureStorageService.extractBlobNameFromUrl(
        company.logoUrl,
      );
      if (blobName) {
        // Delete asynchronously, don't wait for result
        azureStorageService.deleteFile(blobName).catch((error) => {
          console.error(
            `Failed to delete logo for company ${company.id}:`,
            error,
          );
        });
      }
    }

    // Delete company (cascade deletes will handle related records)
    await prisma.company.delete({
      where: {
        id: id.trim(),
      },
    });

    console.log(`✓ Company deleted successfully: ${id}`);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Company deleted successfully",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting company:", error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Record not found
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            error: "Company not found",
          },
          { status: 404 },
        );
      }

      // Foreign key constraint violation
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot delete company: it has related records that must be deleted first",
          },
          { status: 409 },
        );
      }
    }

    // Handle general errors
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
