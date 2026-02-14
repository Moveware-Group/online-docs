/**
 * Companies API Route
 * GET /api/companies - List companies with tenant filtering and pagination
 *
 * This endpoint provides tenant-isolated access to companies.
 * Users can only see companies belonging to their tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
