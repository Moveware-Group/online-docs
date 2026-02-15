import { NextRequest, NextResponse } from "next/server";
import { movewareClient } from "@/lib/clients/moveware";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Validate pagination params
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "Invalid pagination parameters" },
        { status: 400 },
      );
    }

    // Fetch all companies from Moveware API
    // Note: If Moveware API supports pagination in the future, we can pass page/limit directly
    const companies = await movewareClient.getCompanies();

    if (!companies || !Array.isArray(companies)) {
      return NextResponse.json(
        { error: "Invalid response from Moveware API" },
        { status: 500 },
      );
    }

    // Calculate pagination
    const total = companies.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCompanies = companies.slice(startIndex, endIndex);

    // Return paginated response with metadata
    return NextResponse.json({
      companies: paginatedCompanies,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
        hasPrevious: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const company = await movewareClient.createCompany(body);
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 },
    );
  }
}
