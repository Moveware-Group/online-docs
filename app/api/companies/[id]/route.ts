/**
 * Company Detail API
 * GET /api/companies/[id] - Get company details
 * PUT /api/companies/[id] - Update company (supports multipart/form-data for logo uploads)
 * DELETE /api/companies/[id] - Delete company
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { azureStorageService } from "@/lib/services/azureStorage";
import { Prisma } from "@prisma/client";

/**
 * GET /api/companies/[id]
 * Fetch company details with settings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
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
    return NextResponse.json(
      { success: false, error: "Failed to fetch company" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/companies/[id]
 * Update company details with support for:
 * - JSON body for name and settings updates
 * - multipart/form-data for logo uploads
 * - Partial updates (only provided fields are updated)
 * - Logo replacement (new logo deletes old one)
 * - Logo removal (set logoUrl to null)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    if (!existingCompany) {
      return NextResponse.json(
        { success: false, error: "Company not found" },
        { status: 404 },
      );
    }

    // Determine content type
    const contentType = request.headers.get("content-type") || "";
    const isMultipart = contentType.includes("multipart/form-data");

    let updateData: any = {};
    let logoFile: File | null = null;
    let removeLogo = false;

    // Parse request body based on content type
    if (isMultipart) {
      const formData = await request.formData();

      // Extract company name if provided
      const name = formData.get("name") as string | null;
      if (name) {
        updateData.name = name.trim();
      }

      // Extract logo file if provided
      logoFile = formData.get("logo") as File | null;

      // Check for logo removal flag
      const removeLogoFlag = formData.get("removeLogo") as string | null;
      if (removeLogoFlag === "true") {
        removeLogo = true;
      }

      // Extract color settings
      const primaryColor = formData.get("primaryColor") as string | null;
      const secondaryColor = formData.get("secondaryColor") as string | null;
      const tertiaryColor = formData.get("tertiaryColor") as string | null;

      // Extract hero settings
      const heroTitle = formData.get("heroTitle") as string | null;
      const heroSubtitle = formData.get("heroSubtitle") as string | null;
      const heroBackgroundColor = formData.get("heroBackgroundColor") as
        | string
        | null;
      const heroTextColor = formData.get("heroTextColor") as string | null;

      // Extract copy settings
      const welcomeMessage = formData.get("welcomeMessage") as string | null;
      const introText = formData.get("introText") as string | null;
      const footerText = formData.get("footerText") as string | null;

      // Store settings for later processing
      updateData.settings = {
        branding: { primaryColor, secondaryColor, tertiaryColor },
        hero: { heroTitle, heroSubtitle, heroBackgroundColor, heroTextColor },
        copy: { welcomeMessage, introText, footerText },
      };
    } else {
      // Parse JSON body
      const body = await request.json();

      // Extract company name
      if (body.name !== undefined) {
        updateData.name = body.name?.trim() || existingCompany.name;
      }

      // Check for logo removal
      if (body.logoUrl === null || body.removeLogo === true) {
        removeLogo = true;
      }

      // Extract color settings
      const primaryColor = body.primaryColor;
      const secondaryColor = body.secondaryColor;
      const tertiaryColor = body.tertiaryColor;

      // Extract hero settings
      const heroTitle = body.heroTitle;
      const heroSubtitle = body.heroSubtitle;
      const heroBackgroundColor = body.heroBackgroundColor;
      const heroTextColor = body.heroTextColor;

      // Extract copy settings
      const welcomeMessage = body.welcomeMessage;
      const introText = body.introText;
      const footerText = body.footerText;

      // Store settings for later processing
      updateData.settings = {
        branding: { primaryColor, secondaryColor, tertiaryColor },
        hero: { heroTitle, heroSubtitle, heroBackgroundColor, heroTextColor },
        copy: { welcomeMessage, introText, footerText },
      };
    }

    // Validate color formats if provided
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const colors = [
      {
        name: "primaryColor",
        value: updateData.settings?.branding?.primaryColor,
      },
      {
        name: "secondaryColor",
        value: updateData.settings?.branding?.secondaryColor,
      },
      {
        name: "tertiaryColor",
        value: updateData.settings?.branding?.tertiaryColor,
      },
      {
        name: "heroBackgroundColor",
        value: updateData.settings?.hero?.heroBackgroundColor,
      },
      {
        name: "heroTextColor",
        value: updateData.settings?.hero?.heroTextColor,
      },
    ];

    for (const color of colors) {
      if (color.value && !hexColorRegex.test(color.value)) {
        return NextResponse.json(
          {
            success: false,
            error: `${color.name} must be a valid hex color (e.g., #2563eb)`,
          },
          { status: 400 },
        );
      }
    }

    let newLogoUrl: string | null = null;

    // Handle logo upload
    if (logoFile) {
      // Check if Azure Storage is configured
      const isConfigured = await azureStorageService.isConfigured();
      if (!isConfigured) {
        return NextResponse.json(
          {
            success: false,
            error: "File storage is not configured. Please contact support.",
          },
          { status: 503 },
        );
      }

      // Convert File to Buffer
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Azure Blob Storage
      const uploadResult = await azureStorageService.uploadFile(
        buffer,
        id,
        logoFile.type,
      );

      if (!uploadResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: uploadResult.error || "Failed to upload logo",
          },
          { status: 400 },
        );
      }

      if (!uploadResult.url) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to upload logo",
          },
          { status: 400 },
        );
      }

      newLogoUrl = uploadResult.url;

      // Delete old logo if exists
      if (existingCompany.logoUrl) {
        const oldBlobName = azureStorageService.extractBlobNameFromUrl(
          existingCompany.logoUrl,
        );
        if (oldBlobName) {
          azureStorageService.deleteFile(oldBlobName).catch((error) => {
            console.error("Failed to delete old logo:", error);
          });
        }
      }
    }

    // Handle logo removal
    if (removeLogo && !logoFile) {
      // Delete existing logo from storage
      if (existingCompany.logoUrl) {
        const oldBlobName = azureStorageService.extractBlobNameFromUrl(
          existingCompany.logoUrl,
        );
        if (oldBlobName) {
          const deleteResult =
            await azureStorageService.deleteFile(oldBlobName);
          if (!deleteResult.success) {
            console.error("Failed to delete logo:", deleteResult.error);
          }
        }
      }

      newLogoUrl = null;
    }

    // Build company update data
    const companyUpdateData: any = {
      updatedAt: new Date(),
    };

    if (updateData.name !== undefined) {
      companyUpdateData.name = updateData.name;
    }

    if (newLogoUrl !== null) {
      companyUpdateData.logoUrl = newLogoUrl;
    } else if (removeLogo) {
      companyUpdateData.logoUrl = null;
    }

    // Update colors on Company table if provided
    if (updateData.settings?.branding?.primaryColor !== undefined) {
      companyUpdateData.primaryColor =
        updateData.settings.branding.primaryColor;
    }
    if (updateData.settings?.branding?.secondaryColor !== undefined) {
      companyUpdateData.secondaryColor =
        updateData.settings.branding.secondaryColor;
    }
    if (updateData.settings?.branding?.tertiaryColor !== undefined) {
      companyUpdateData.tertiaryColor =
        updateData.settings.branding.tertiaryColor;
    }

    // Update company
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: companyUpdateData,
    });

    // Update Branding Settings if any branding fields provided
    const brandingData = updateData.settings?.branding || {};
    const hasBrandingUpdates = Object.values(brandingData).some(
      (value) => value !== undefined && value !== null,
    );

    if (hasBrandingUpdates || newLogoUrl !== null || removeLogo) {
      const brandingUpdateData: any = {};

      if (brandingData.primaryColor !== undefined) {
        brandingUpdateData.primaryColor = brandingData.primaryColor;
      }

      if (brandingData.secondaryColor !== undefined) {
        brandingUpdateData.secondaryColor = brandingData.secondaryColor;
      }

      if (newLogoUrl !== null) {
        brandingUpdateData.logoUrl = newLogoUrl;
      } else if (removeLogo) {
        brandingUpdateData.logoUrl = null;
      }

      await prisma.brandingSettings.upsert({
        where: { companyId: id },
        update: brandingUpdateData,
        create: {
          companyId: id,
          primaryColor: brandingData.primaryColor || "#2563eb",
          secondaryColor: brandingData.secondaryColor || "#1e40af",
          fontFamily: "Inter",
          logoUrl: newLogoUrl || null,
        },
      });
    }

    // Update Hero Settings if any hero fields provided
    const heroData = updateData.settings?.hero || {};
    const hasHeroUpdates = Object.values(heroData).some(
      (value) => value !== undefined && value !== null,
    );

    if (hasHeroUpdates) {
      const heroUpdateData: any = {};

      if (heroData.heroTitle !== undefined) {
        heroUpdateData.title = heroData.heroTitle;
      }
      if (heroData.heroSubtitle !== undefined) {
        heroUpdateData.subtitle = heroData.heroSubtitle;
      }
      if (heroData.heroBackgroundColor !== undefined) {
        heroUpdateData.backgroundColor = heroData.heroBackgroundColor;
      }
      if (heroData.heroTextColor !== undefined) {
        heroUpdateData.textColor = heroData.heroTextColor;
      }

      await prisma.heroSettings.upsert({
        where: { companyId: id },
        update: heroUpdateData,
        create: {
          companyId: id,
          title: heroData.heroTitle || "Welcome",
          subtitle: heroData.heroSubtitle || null,
          backgroundColor: heroData.heroBackgroundColor || "#2563eb",
          textColor: heroData.heroTextColor || "#ffffff",
        },
      });
    }

    // Update Copy Settings if any copy fields provided
    const copyData = updateData.settings?.copy || {};
    const hasCopyUpdates = Object.values(copyData).some(
      (value) => value !== undefined && value !== null,
    );

    if (hasCopyUpdates) {
      const copyUpdateData: any = {};

      if (copyData.welcomeMessage !== undefined) {
        copyUpdateData.welcomeMessage = copyData.welcomeMessage;
      }
      if (copyData.introText !== undefined) {
        copyUpdateData.introText = copyData.introText;
      }
      if (copyData.footerText !== undefined) {
        copyUpdateData.footerText = copyData.footerText;
      }

      await prisma.copySettings.upsert({
        where: { companyId: id },
        update: copyUpdateData,
        create: {
          companyId: id,
          welcomeMessage: copyData.welcomeMessage || "Welcome",
          introText: copyData.introText || "",
          footerText: copyData.footerText || null,
        },
      });
    }

    // Fetch updated settings for response
    const [brandingSettings, heroSettings, copySettings] = await Promise.all([
      prisma.brandingSettings.findUnique({ where: { companyId: id } }),
      prisma.heroSettings.findUnique({ where: { companyId: id } }),
      prisma.copySettings.findUnique({ where: { companyId: id } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedCompany.id,
        name: updatedCompany.name,
        logoUrl: updatedCompany.logoUrl,
        primaryColor: updatedCompany.primaryColor,
        secondaryColor: updatedCompany.secondaryColor,
        tertiaryColor: updatedCompany.tertiaryColor,
        brandingSettings,
        heroSettings,
        copySettings,
        createdAt: updatedCompany.createdAt.toISOString(),
        updatedAt: updatedCompany.updatedAt.toISOString(),
      },
      message: "Company updated successfully",
    });
  } catch (error) {
    console.error("Error updating company:", error);

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { success: false, error: "Company not found" },
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

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/companies/[id]
 * Delete a company
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting company:", error);

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { success: false, error: "Company not found" },
          { status: 404 },
        );
      }
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete company" },
      { status: 500 },
    );
  }
}
