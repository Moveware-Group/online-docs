/**
 * Layout Reference File Upload API
 * POST /api/layouts/upload - Upload a reference PDF for layout generation
 *
 * Accepts PDF files up to 10MB. Stores them in public/uploads/layouts/
 * and returns the file path for use in the layout builder.
 */

import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
];

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.+/g, ".")
    .substring(0, 100);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 10MB limit" },
        { status: 413 },
      );
    }

    // Validate file type
    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");
    const isImage = ALLOWED_MIME_TYPES.includes(file.type);

    if (!isPdf && !isImage) {
      return NextResponse.json(
        {
          success: false,
          error: "Only PDF, PNG, JPEG, and WebP files are allowed",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const sanitized = sanitizeFilename(file.name);
    const ext = path.extname(sanitized);
    const nameWithoutExt = path.basename(sanitized, ext);
    const uuid = crypto.randomUUID();
    const uniqueFilename = `${uuid}_${nameWithoutExt}${ext}`;

    // Store in public/uploads/layouts/
    const uploadDir = path.join(process.cwd(), "public", "uploads", "layouts");

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, buffer);

    // Return URL via the dynamic file-serving API route
    const publicPath = `/api/uploads/layouts/${uniqueFilename}`;

    console.log(`Layout reference file uploaded: ${publicPath}`);

    return NextResponse.json({
      success: true,
      url: publicPath,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Error uploading layout reference file:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload file" },
      { status: 500 },
    );
  }
}
