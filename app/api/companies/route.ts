/**
 * Companies API Route
 * GET /api/companies - List companies with tenant filtering and pagination
 * POST /api/companies - Create a new company with tenant scoping
 *
 * This endpoint provides tenant-isolated access to companies.
 * Users can only see and create companies belonging to their tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  validateCompanyData,
  formatValidationErrors,
} from "@/lib/validations/company";
import crypto from "crypto";

interface GetCompaniesResponse {
  success: boolean;
  data?: {
    companies: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

interface CreateCompanyResponse {
  success: boolean;
  data?: any;
  error?: string;
  fields?:
    | Record<string, string>
    | {
        message: string;
        fields: Record<string, string>;
      };
}

/**
 * GET /api/companies
 * Retrieve companies filtered by tenant ID with pagination
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 *
 * Headers:
 * - X-Tenant-Id: Tenant ID for filtering (required)
 * - Authorization: Bearer token (required)
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<GetCompaniesResponse>> {
  try {
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

    // Parse pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
    ); // Max 100 per page

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Query total count for pagination metadata
    const totalCount = await prisma.company.count({
      where: {
        tenantId: tenantId.trim(),
      },
    });

    // Query companies filtered by tenant ID with pagination
    const companies = await prisma.company.findMany({
      where: {
        tenantId: tenantId.trim(),
      },
      orderBy: [
        { isActive: "desc" }, // Active companies first
        { name: "asc" }, // Then alphabetically
      ],
      skip,
      take: limit,
    });

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    // Return paginated results
    return NextResponse.json(
      {
        success: true,
        data: {
          companies,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
          },
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching companies:", error);

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
        error: "Failed to fetch companies. Please try again later.",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/companies
 * Create a new company with tenant scoping and validation
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
 * - X-Tenant-Id: Tenant ID for scoping (required)
 * - Authorization: Bearer token (required)
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<CreateCompanyResponse>> {
  try {
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
    let body: any;
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

    // Validate required and optional fields
    const validation = validateCompanyData({
      company_name: body.company_name,
      brand_code: body.brand_code,
      primary_color: body.primary_color,
      secondary_color: body.secondary_color,
      tertiary_color: body.tertiary_color,
      logo_url: body.logo_url,
      hero_content: body.hero_content,
      copy_content: body.copy_content,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          fields: formatValidationErrors(validation.errors),
        },
        { status: 400 },
      );
    }

    // Check for duplicate brand_code within tenant
    const existingCompany = await prisma.company.findFirst({
      where: {
        tenantId: tenantId.trim(),
        brandCode: body.brand_code.trim(),
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: "Company with this brand code already exists",
          fields: {
            brand_code: "This brand code is already in use",
          },
        },
        { status: 409 },
      );
    }

    // Generate a secure API key for the new company
    const apiKey = crypto.randomUUID();

    // Create company with tenant scoping
    const company = await prisma.company.create({
      data: {
        tenantId: tenantId.trim(),
        name: body.company_name,
        brandCode: body.brand_code,
        apiKey,
        primaryColor: body.primary_color,
        secondaryColor: body.secondary_color,
        tertiaryColor: body.tertiary_color,
        logoUrl: body.logo_url,
        heroContent: body.hero_content,
        copyContent: body.copy_content,
        isActive: true,
      },
    });

    console.log(
      `✓ Company created: ${company.id} (${company.name}) for tenant ${tenantId}`,
    );

    return NextResponse.json(
      {
        success: true,
        data: company,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating company:", error);

    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Unique constraint violation
      if (error.code === "P2002") {
        const target = (error.meta?.target as string[]) || [];
        if (target.includes("brandCode")) {
          return NextResponse.json(
            {
              success: false,
              error: "Company with this brand code already exists",
              fields: {
                brand_code: "This brand code is already in use",
              },
            },
            { status: 409 },
          );
        }
      }

      // Foreign key constraint violation
      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid foreign key reference",
          },
          { status: 400 },
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
        error: "Failed to create company. Please try again later.",
      },
      { status: 500 },
    );
  }
}
