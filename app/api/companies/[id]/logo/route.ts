import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/middleware/auth";
import { UploadLogoResponse } from "@/lib/types/company";

/**
 * POST /api/companies/[id]/logo
 * Upload company logo
 *
 * Authorization: Requires admin role and company access
 *
 * TODO: Consider using cloud storage (S3, Azure Blob Storage) for production
 * Current implementation saves to public/uploads directory
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: companyId } = await params;

    // Verify authentication and authorization
    const authError = await requireAdmin(request, companyId);
    if (authError) {
      return NextResponse.json<UploadLogoResponse>(
        { success: false, error: authError.error },
        { status: authError.status },
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("logo") as File | null;

    if (!file) {
      return NextResponse.json<UploadLogoResponse>(
        {
          success: false,
          error: 'No logo file provided. Please include a file with key "logo"',
        },
        { status: 400 },
      );
    }

    // Validate file type (images only)
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json<UploadLogoResponse>(
        {
          success: false,
          error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json<UploadLogoResponse>(
        {
          success: false,
          error: "File size exceeds 5MB limit",
        },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `logo-${companyId}-${timestamp}.${fileExtension}`;

    // Ensure upload directory exists
    const uploadDir = join(process.cwd(), "public", "uploads", "logos");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const logoUrl = `/uploads/logos/${fileName}`;

    // Update company branding settings with new logo URL
    await prisma.brandingSettings.upsert({
      where: { companyId },
      update: { logoUrl },
      create: {
        companyId,
        logoUrl,
        primaryColor: "#2563eb",
        secondaryColor: "#1e40af",
        fontFamily: "Inter",
      },
    });

    return NextResponse.json<UploadLogoResponse>(
      {
        success: true,
        data: { logoUrl },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error uploading logo:", error);

    // Handle file system errors
    if (error instanceof Error && error.message.includes("EACCES")) {
      return NextResponse.json<UploadLogoResponse>(
        {
          success: false,
          error: "Permission denied. Unable to save file.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json<UploadLogoResponse>(
      {
        success: false,
        error: "Failed to upload logo",
      },
      { status: 500 },
    );
  }
}
