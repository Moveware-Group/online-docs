/**
 * Company Logo Upload API
 * POST /api/companies/upload - Upload company logo with validation
 *
 * Restored functionality for local file system storage.
 * Validates file type using magic number detection, enforces size limits,
 * sanitizes filenames, and stores in tenant-scoped directories.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { fileTypeFromBuffer } from "file-type";
import crypto from "crypto";

interface UploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed MIME types (binary formats detected by magic bytes)
const ALLOWED_BINARY_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];

/**
 * Sanitize filename to prevent directory traversal and other attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove path separators and special characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .substring(0, 100); // Limit length
}

/**
 * Generate unique filename using UUID and sanitized original name
 */
function generateUniqueFilename(originalFilename: string): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = path.extname(sanitized);
  const nameWithoutExt = path.basename(sanitized, ext);
  const uuid = crypto.randomUUID();

  return `${uuid}_${nameWithoutExt}${ext}`;
}

/**
 * POST /api/companies/upload
 * Upload company logo with validation and security checks
 *
 * Headers:
 * - X-Tenant-Id: Tenant ID for scoping (required)
 * - Authorization: Bearer token (required)
 *
 * Form Data:
 * - file: Image file (PNG, JPEG, SVG, or WebP, max 5MB)
 *
 * Returns:
 * - 200: Upload successful with file URL
 * - 400: Invalid file (wrong type, missing file)
 * - 401: Unauthorized (missing tenant ID or auth token)
 * - 413: File size exceeds 5MB limit
 * - 500: Server error (file system issues)
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<UploadResponse>> {
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

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided",
        },
        { status: 400 },
      );
    }

    // Check file size (5MB limit)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds maximum allowed size of ${
            MAX_FILE_SIZE / 1024 / 1024
          }MB`,
        },
        { status: 413 },
      );
    }

    // Convert File to Buffer for validation
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Determine if this is an SVG (text-based, no magic bytes)
    const isSvg = file.type === "image/svg+xml" ||
      file.name.toLowerCase().endsWith(".svg");

    if (isSvg) {
      // SVG validation: check that content looks like valid SVG markup
      const text = buffer.toString("utf-8").trim();
      const looksLikeSvg = text.startsWith("<?xml") ||
        text.startsWith("<svg") ||
        text.includes("<svg");

      if (!looksLikeSvg) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid SVG file. The file does not contain valid SVG markup.",
          },
          { status: 400 },
        );
      }

      // Basic XSS sanitisation: reject SVGs containing script tags or event handlers
      const dangerous = /<script[\s>]|on\w+\s*=/i;
      if (dangerous.test(text)) {
        return NextResponse.json(
          {
            success: false,
            error: "SVG file contains potentially unsafe content (scripts or event handlers).",
          },
          { status: 400 },
        );
      }
    } else {
      // Binary image validation via magic bytes
      const fileType = await fileTypeFromBuffer(buffer);

      if (!fileType || !ALLOWED_BINARY_MIME_TYPES.includes(fileType.mime)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid file type. Only PNG, JPEG, SVG, and WebP images are allowed.",
          },
          { status: 400 },
        );
      }
    }

    // Generate unique filename (UUID + sanitized original name)
    const uniqueFilename = generateUniqueFilename(file.name);

    // Create directory path: public/uploads/companies/[tenant_id]/
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "companies",
      tenantId.trim(),
    );

    // Ensure directory exists (create if not)
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Full file path
    const filePath = path.join(uploadDir, uniqueFilename);

    // Write file to disk
    await writeFile(filePath, buffer);

    // Generate public URL (relative to public directory)
    const publicPath = `/uploads/companies/${tenantId.trim()}/${uniqueFilename}`;

    console.log(`✓ File uploaded successfully: ${publicPath}`);

    // Return success response with file URL/path
    return NextResponse.json(
      {
        success: true,
        url: publicPath,
        path: publicPath,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error uploading file:", error);

    // Handle specific errors
    if (error instanceof Error) {
      // File system permission errors
      if (
        error.message.includes("EACCES") ||
        error.message.includes("permission")
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "File system permission error. Please contact support.",
          },
          { status: 500 },
        );
      }

      // Disk space errors
      if (error.message.includes("ENOSPC")) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient disk space. Please contact support.",
          },
          { status: 500 },
        );
      }

      // Directory creation errors
      if (error.message.includes("EEXIST")) {
        return NextResponse.json(
          {
            success: false,
            error: "File system conflict. Please try again.",
          },
          { status: 500 },
        );
      }
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file. Please try again.",
      },
      { status: 500 },
    );
  }
}
