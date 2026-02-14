/**
 * Company Logo Upload API
 *
 * Handles logo upload, retrieval, and deletion for companies.
 * Uses Azure Blob Storage for file storage with comprehensive validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { azureStorageService } from "@/lib/services/azureStorage";

/**
 * GET /api/companies/[id]/logo
 * Retrieve company logo URL
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch company from database
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
    });
  } catch (error) {
    console.error("Error fetching company logo:", error);
    return NextResponse.json(
      { error: "Failed to fetch company logo" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/companies/[id]/logo
 * Upload a new company logo
 *
 * Accepts multipart/form-data with 'logo' field
 * Validates file size (max 2MB) and MIME type (PNG, JPEG, WebP only)
 * Uses MIME sniffing to prevent type spoofing
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        logoUrl: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check if Azure Storage is configured
    const isConfigured = await azureStorageService.isConfigured();
    if (!isConfigured) {
      return NextResponse.json(
        { error: "File storage is not configured. Please contact support." },
        { status: 503 },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Please upload a logo image." },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Azure Blob Storage (includes validation)
    const uploadResult = await azureStorageService.uploadFile(
      buffer,
      id,
      file.type,
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || "Failed to upload logo" },
        { status: 400 },
      );
    }

    // Delete old logo if exists
    if (company.logoUrl) {
      const oldBlobName = azureStorageService.extractBlobNameFromUrl(
        company.logoUrl,
      );
      if (oldBlobName) {
        // Delete asynchronously, don't wait for result
        azureStorageService.deleteFile(oldBlobName).catch((error) => {
          console.error("Failed to delete old logo:", error);
        });
      }
    }

    // Update company with new logo URL
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        logoUrl: uploadResult.url,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    return NextResponse.json({
      message: "Logo uploaded successfully",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Error uploading company logo:", error);
    return NextResponse.json(
      { error: "Failed to upload company logo" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/companies/[id]/logo
 * Delete company logo
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch company
    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        logoUrl: true,
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    if (!company.logoUrl) {
      return NextResponse.json({ error: "No logo to delete" }, { status: 404 });
    }

    // Extract blob name from URL
    const blobName = azureStorageService.extractBlobNameFromUrl(
      company.logoUrl,
    );
    if (!blobName) {
      return NextResponse.json(
        { error: "Invalid logo URL format" },
        { status: 400 },
      );
    }

    // Delete from Azure Blob Storage
    const deleteResult = await azureStorageService.deleteFile(blobName);
    if (!deleteResult.success) {
      console.error("Failed to delete logo from storage:", deleteResult.error);
      // Continue anyway to remove from database
    }

    // Remove logo URL from database
    await prisma.company.update({
      where: { id },
      data: {
        logoUrl: null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Logo deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting company logo:", error);
    return NextResponse.json(
      { error: "Failed to delete company logo" },
      { status: 500 },
    );
  }
}
