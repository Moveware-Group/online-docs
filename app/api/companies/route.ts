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
 * - brand_code: string (required, alphanumeric, max 50 chars)
 * - primary_color: string (optional, hex format #RRGGBB)
 * - secondary_color: string (optional, hex format #RRGGBB)
 * - tertiary_color: string (optional, hex format #RRGGBB)
 * - logo_url: string (optional)
 * - hero_content: string (optional, max 5000 chars)
 * - copy_content: string (optional, max 5000 chars)
 *
 * Headers:
 * - X-Tenant-Id: Tenant ID for scoping (required)
 * - Authorization: Bearer token (required)
 *
 * Returns:
 * - 201: Created company object
 * - 400: Validation error
 * - 401: Unauthorized
 * - 409: Duplicate brand_code within tenant
 * - 500: Internal server error
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

    // Validate required field: company_name
    if (
      !body.company_name ||
      typeof body.company_name !== "string" ||
      body.company_name.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Company name is required and must be a non-empty string",
        },
        { status: 400 },
      );
    }

    const companyName = body.company_name.trim();
    if (companyName.length > 255) {
      return NextResponse.json(
        {
          success: false,
          error: "Company name must not exceed 255 characters",
        },
        { status: 400 },
      );
    }

    // Validate required field: brand_code
    if (
      !body.brand_code ||
      typeof body.brand_code !== "string" ||
      body.brand_code.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Brand code is required and must be a non-empty string",
        },
        { status: 400 },
      );
    }

    const brandCode = body.brand_code.trim();
    if (brandCode.length > 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Brand code must not exceed 50 characters",
        },
        { status: 400 },
      );
    }

    // Validate brand_code: alphanumeric only
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(brandCode)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Brand code must contain only alphanumeric characters (letters and numbers)",
        },
        { status: 400 },
      );
    }

    // Validate optional color fields (hex format #RRGGBB)
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    if (body.primary_color && !hexColorRegex.test(body.primary_color)) {
      return NextResponse.json(
        {
          success: false,
          error: "Primary color must be a valid hex color in format #RRGGBB",
        },
        { status: 400 },
      );
    }

    if (body.secondary_color && !hexColorRegex.test(body.secondary_color)) {
      return NextResponse.json(
        {
          success: false,
          error: "Secondary color must be a valid hex color in format #RRGGBB",
        },
        { status: 400 },
      );
    }

    if (body.tertiary_color && !hexColorRegex.test(body.tertiary_color)) {
      return NextResponse.json(
        {
          success: false,
          error: "Tertiary color must be a valid hex color in format #RRGGBB",
        },
        { status: 400 },
      );
    }

    // Validate logo_url if provided
    if (body.logo_url && typeof body.logo_url !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Logo URL must be a string",
        },
        { status: 400 },
      );
    }

    // Validate hero_content max length (5000 chars)
    if (body.hero_content) {
      if (typeof body.hero_content !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "Hero content must be a string",
          },
          { status: 400 },
        );
      }
      if (body.hero_content.length > 5000) {
        return NextResponse.json(
          {
            success: false,
            error: "Hero content must not exceed 5000 characters",
          },
          { status: 400 },
        );
      }
    }

    // Validate copy_content max length (5000 chars)
    if (body.copy_content) {
      if (typeof body.copy_content !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "Copy content must be a string",
          },
          { status: 400 },
        );
      }
      if (body.copy_content.length > 5000) {
        return NextResponse.json(
          {
            success: false,
            error: "Copy content must not exceed 5000 characters",
          },
          { status: 400 },
        );
      }
    }

    // Check for duplicate brand_code within tenant
    const existingCompany = await prisma.company.findFirst({
      where: {
        tenantId: tenantId.trim(),
        brandCode: brandCode,
      },
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A company with this brand code already exists for this tenant",
        },
        { status: 409 },
      );
    }

    // Generate unique API key
    const crypto = await import("crypto");
    const apiKey = crypto.randomBytes(32).toString("hex");

    // Insert into database
    const company = await prisma.company.create({
      data: {
        name: companyName,
        apiKey: apiKey,
        tenantId: tenantId.trim(),
        brandCode: brandCode,
        primaryColor: body.primary_color || "#2563eb",
        secondaryColor: body.secondary_color || "#1e40af",
        tertiaryColor: body.tertiary_color || "#60a5fa",
        logoUrl: body.logo_url?.trim() || null,
        heroContent: body.hero_content?.trim() || null,
        copyContent: body.copy_content?.trim() || null,
        isActive: true,
      },
    });

    // Return created company
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
      // Handle unique constraint violations (P2002)
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            error: "A company with this brand code already exists",
          },
          { status: 409 },
        );
      }
    }

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
        error: "Failed to create company. Please try again later.",
      },
      { status: 500 },
    );
  }
}
