/**
 * Dynamic File Serving API
 * GET /api/uploads/[...path] - Serve uploaded files from the uploads directory
 *
 * This route serves files that were uploaded dynamically (e.g. company logos).
 * Next.js does not reliably serve files added to public/ after build time,
 * so this API route ensures uploaded files are always accessible.
 */

import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/** Map file extensions to MIME types */
const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  try {
    const { path: segments } = await params;

    if (!segments || segments.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Sanitize each segment to prevent directory traversal
    const sanitizedSegments = segments.map((seg) =>
      seg.replace(/\.\./g, "").replace(/[^a-zA-Z0-9._-]/g, "_"),
    );

    // Build the file path relative to public/uploads/
    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      ...sanitizedSegments,
    );

    // Security: ensure resolved path is within the uploads directory
    const uploadsRoot = path.join(process.cwd(), "public", "uploads");
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(uploadsRoot)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check file exists
    if (!existsSync(resolvedPath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(resolvedPath);

    // Determine content type from extension
    const ext = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (error) {
    console.error("Error serving uploaded file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 },
    );
  }
}
