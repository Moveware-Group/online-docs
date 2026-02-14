/**
 * GET /api/companies
 * List all companies with their settings and branding
 *
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search by company name (optional)
 *
 * Headers:
 * - X-Company-Id: Filter by specific company ID (optional tenant scoping)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface CompanyResponse {
  id: string;
  name: string;
  brandCode: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  tertiaryColor: string | null;
  heroContent: {
    title: string | null;
    subtitle: string | null;
    backgroundColor: string | null;
    textColor: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface CompaniesApiResponse {
  success: boolean;
  data: CompanyResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20")),
    );
    const skip = (page - 1) * limit;

    // Search parameter
    const search = searchParams.get("search");

    // Tenant scoping via header
    const companyIdHeader = request.headers.get("X-Company-Id");

    // Build where clause
    const whereClause: any = {};

    // Apply tenant scoping if header is provided
    if (companyIdHeader) {
      whereClause.id = companyIdHeader;
    }

    // Apply search filter
    if (search) {
      whereClause.name = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.company.count({
      where: whereClause,
    });

    // Fetch companies (relations are not defined on Company in schema)
    const companies = await prisma.company.findMany({
      where: whereClause,
      orderBy: {
        name: "asc",
      },
      skip,
      take: limit,
    });

    // Fetch related settings separately
    const companyIds = companies.map((company) => company.id);

    const [brandingSettings, heroSettings] = await Promise.all([
      companyIds.length > 0
        ? prisma.brandingSettings.findMany({
            where: {
              companyId: { in: companyIds },
            },
          })
        : Promise.resolve([]),
      companyIds.length > 0
        ? prisma.heroSettings.findMany({
            where: {
              companyId: { in: companyIds },
            },
          })
        : Promise.resolve([]),
    ]);

    const brandingMap = new Map(
      brandingSettings.map((settings) => [settings.companyId, settings]),
    );
    const heroMap = new Map(
      heroSettings.map((settings) => [settings.companyId, settings]),
    );

    // Transform to response format
    const companiesData: CompanyResponse[] = companies.map((company) => {
      const branding = brandingMap.get(company.id);
      const hero = heroMap.get(company.id);

      return {
        id: company.id,
        name: company.name,
        brandCode: null,
        logoUrl: company.logoUrl || branding?.logoUrl || null,
        primaryColor: branding?.primaryColor ?? company.primaryColor ?? null,
        secondaryColor:
          branding?.secondaryColor ?? company.secondaryColor ?? null,
        tertiaryColor: company.tertiaryColor ?? null,
        heroContent: hero
          ? {
              title: hero.title || null,
              subtitle: hero.subtitle || null,
              backgroundColor: hero.backgroundColor || null,
              textColor: hero.textColor || null,
            }
          : null,
        createdAt: company.createdAt.toISOString(),
        updatedAt: company.updatedAt.toISOString(),
      };
    });

    const totalPages = Math.ceil(totalCount / limit);

    const response: CompaniesApiResponse = {
      success: true,
      data: companiesData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching companies:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch companies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
