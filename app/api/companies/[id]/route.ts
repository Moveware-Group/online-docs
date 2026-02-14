/**
 * Company Detail API Route
 * GET /api/companies/[id] - Fetch single company with tenant filtering
 *
 * This endpoint provides tenant-isolated access to a specific company.
 * Users can only access companies belonging to their tenant.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface GetCompanyResponse {
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
