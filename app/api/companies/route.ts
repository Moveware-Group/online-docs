/**
 * Companies API
 * GET /api/companies - List all companies with their settings and branding
 * POST /api/companies - Create a new company with settings and logo
 *
 * GET Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - search: Search by company name (optional)
 *
 * Headers:
 * - X-Company-Id: Filter by specific company ID (optional tenant scoping)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { azureStorageService } from "@/lib/services/azureStorage";
import { Prisma } from "@prisma/client";
import crypto from "crypto";

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

interface CreateCompanyResponse {
  success: boolean;
  data?: {
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
    apiKey: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
  details?: string;
}

/**
 * GET /api/companies
 * List all companies with their settings and branding
 */
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
        details:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/companies
 * Create a new company with branding settings and optional logo
 *
 * Accepts multipart/form-data with the following fields:
 * - name (required): Company name (string)
 * - brandCode (optional): Brand identifier (string, not stored in DB - reserved for future use)
 * - primaryColor (optional): Primary brand color (hex format)
 * - secondaryColor (optional): Secondary brand color (hex format)
 * - tertiaryColor (optional): Tertiary brand color (hex format)
 * - heroContent (optional): JSON string with {title, subtitle, backgroundColor, textColor}
 * - logo (optional): Logo image file (PNG, JPEG, WebP; max 2MB)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();

    // Extract and validate required fields
    const name = formData.get("name") as string | null;

    if (!name || name.trim() === "") {
      return NextResponse.json<CreateCompanyResponse>(
        {
          success: false,
          error: "Company name is required",
        },
        { status: 400 },
      );
    }

    // Validate name length
    if (name.length > 255) {
      return NextResponse.json<CreateCompanyResponse>(
        {
          success: false,
          error: "Company name must be 255 characters or less",
        },
        { status: 400 },
      );
    }

    // Extract optional fields
    const brandCode = formData.get("brandCode") as string | null;
    const primaryColor = formData.get("primaryColor") as string | null;
    const secondaryColor = formData.get("secondaryColor") as string | null;
    const tertiaryColor = formData.get("tertiaryColor") as string | null;
    const heroContentString = formData.get("heroContent") as string | null;
    const logoFile = formData.get("logo") as File | null;

    // Validate hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

    if (primaryColor && !hexColorRegex.test(primaryColor)) {
      return NextResponse.json<CreateCompanyResponse>(
        {
          success: false,
          error:
            "Primary color must be a valid hex color (e.g., #2563eb or #fff)",
        },
        { status: 400 },
      );
    }

    if (secondaryColor && !hexColorRegex.test(secondaryColor)) {
      return NextResponse.json<CreateCompanyResponse>(
        {
          success: false,
          error:
            "Secondary color must be a valid hex color (e.g., #1e40af or #000)",
        },
        { status: 400 },
      );
    }

    if (tertiaryColor && !hexColorRegex.test(tertiaryColor)) {
      return NextResponse.json<CreateCompanyResponse>(
        {
          success: false,
          error:
            "Tertiary color must be a valid hex color (e.g., #10b981 or #0f0)",
        },
        { status: 400 },
      );
    }

    // Parse and validate heroContent JSON
    let heroContent: {
      title?: string;
      subtitle?: string;
      backgroundColor?: string;
      textColor?: string;
    } | null = null;

    if (heroContentString) {
      try {
        heroContent = JSON.parse(heroContentString);

        // Validate hero content colors if provided
        if (
          heroContent?.backgroundColor &&
          !hexColorRegex.test(heroContent.backgroundColor)
        ) {
          return NextResponse.json<CreateCompanyResponse>(
            {
              success: false,
              error:
                "Hero background color must be a valid hex color (e.g., #2563eb)",
            },
            { status: 400 },
          );
        }

        if (
          heroContent?.textColor &&
          !hexColorRegex.test(heroContent.textColor)
        ) {
          return NextResponse.json<CreateCompanyResponse>(
            {
              success: false,
              error:
                "Hero text color must be a valid hex color (e.g., #ffffff)",
            },
            { status: 400 },
          );
        }
      } catch (error) {
        return NextResponse.json<CreateCompanyResponse>(
          {
            success: false,
            error:
              "Invalid heroContent JSON format. Expected {title, subtitle, backgroundColor, textColor}",
          },
          { status: 400 },
        );
      }
    }

    // Handle logo file upload if provided
    let logoUrl: string | null = null;

    if (logoFile) {
      // Check if Azure Storage is configured
      const isConfigured = await azureStorageService.isConfigured();
      if (!isConfigured) {
        return NextResponse.json<CreateCompanyResponse>(
          {
            success: false,
            error:
              "File storage is not configured. Please contact support or omit the logo field.",
          },
          { status: 503 },
        );
      }

      // Convert File to Buffer
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Generate temporary company ID for logo upload
      const tempCompanyId = crypto.randomUUID();

      // Upload to Azure Blob Storage
      const uploadResult = await azureStorageService.uploadFile(
        buffer,
        tempCompanyId,
        logoFile.type,
      );

      if (!uploadResult.success) {
        return NextResponse.json<CreateCompanyResponse>(
          {
            success: false,
            error: uploadResult.error || "Failed to upload logo",
            details:
              "Logo validation failed. Ensure file is PNG, JPEG, or WebP and under 2MB.",
          },
          { status: 400 },
        );
      }

      logoUrl = uploadResult.url ?? null;
    }

    // Generate unique API key for the company
    const apiKey = `mw_${crypto.randomBytes(32).toString("hex")}`;

    // Create company record in database
    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        logoUrl,
        primaryColor: primaryColor || undefined,
        secondaryColor: secondaryColor || undefined,
        tertiaryColor: tertiaryColor || undefined,
        apiKey,
      },
    });

    // Create branding settings
    await prisma.brandingSettings.create({
      data: {
        companyId: company.id,
        logoUrl,
        primaryColor: primaryColor || "#2563eb",
        secondaryColor: secondaryColor || "#1e40af",
        fontFamily: "Inter",
      },
    });

    // Create hero settings if heroContent provided
    let createdHeroSettings = null;
    if (heroContent) {
      createdHeroSettings = await prisma.heroSettings.create({
        data: {
          companyId: company.id,
          title: heroContent.title || "Welcome",
          subtitle: heroContent.subtitle || null,
          backgroundColor: heroContent.backgroundColor || "#2563eb",
          textColor: heroContent.textColor || "#ffffff",
        },
      });
    }

    // Construct response
    const response: CreateCompanyResponse = {
      success: true,
      data: {
        id: company.id,
        name: company.name,
        brandCode: brandCode || null,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor,
        tertiaryColor: company.tertiaryColor,
        heroContent: createdHeroSettings
          ? {
              title: createdHeroSettings.title,
              subtitle: createdHeroSettings.subtitle,
              backgroundColor: createdHeroSettings.backgroundColor,
              textColor: createdHeroSettings.textColor,
            }
          : null,
        apiKey,
        createdAt: company.createdAt.toISOString(),
        updatedAt: company.updatedAt.toISOString(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating company:", error);

    // Handle unique constraint violation (duplicate company name)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json<CreateCompanyResponse>(
        {
          success: false,
          error: "A company with this name already exists",
        },
        { status: 409 },
      );
    }

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<CreateCompanyResponse>(
        {
          success: false,
          error: "Invalid JSON format in heroContent field",
        },
        { status: 400 },
      );
    }

    return NextResponse.json<CreateCompanyResponse>(
      {
        success: false,
        error: "Failed to create company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
