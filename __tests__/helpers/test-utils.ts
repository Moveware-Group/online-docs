/**
 * Test Utilities
 * Helper functions for testing Next.js API routes
 */

import { NextRequest } from "next/server";

/**
 * Create mock params for Next.js API routes
 * Routes expect params as { params: Promise<Record<string, string>> }
 */
export function createMockParams(params: Record<string, string>): {
  params: Promise<Record<string, string>>;
} {
  return { params: Promise.resolve(params) };
}

/**
 * Create a mock Next.js request
 */
export function createMockRequest(
  url: string,
  options: RequestInit = {},
): NextRequest {
  return new NextRequest(url, options);
}

/**
 * Extract JSON from Response
 */
export async function getResponseJson(response: Response): Promise<any> {
  return await response.json();
}

/**
 * Create a mock file for upload testing
 */
export function createMockFile(
  filename: string,
  content: string,
  mimeType: string,
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Create a large file for testing file size limits (default 3MB - exceeds 2MB limit)
 */
export function createLargeFile(sizeInMB: number = 3): File {
  const size = sizeInMB * 1024 * 1024;
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type: "image/png" });
  return new File([blob], "large-file.png", { type: "image/png" });
}

/**
 * Create FormData with file for upload testing
 */
export function createFormDataWithFile(
  fieldName: string,
  file: File,
): FormData {
  const formData = new FormData();
  formData.append(fieldName, file);
  return formData;
}

/**
 * Mock admin authentication headers
 * Uses placeholder token matching auth middleware expectations
 */
export function mockAdminHeaders(): HeadersInit {
  return {
    Authorization: "Bearer admin-token",
    "Content-Type": "application/json",
  };
}

/**
 * Mock staff authentication headers
 * Uses placeholder token matching auth middleware expectations
 */
export function mockStaffHeaders(): HeadersInit {
  return {
    Authorization: "Bearer staff-token",
    "Content-Type": "application/json",
  };
}

/**
 * Mock unauthenticated headers
 */
export function mockUnauthenticatedHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Create PNG image buffer for testing
 * Creates a minimal valid PNG file
 */
export function createPngBuffer(): Buffer {
  // Minimal valid PNG: 1x1 transparent pixel
  const pngSignature = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const ihdr = Buffer.from([
    0x00,
    0x00,
    0x00,
    0x0d, // Length
    0x49,
    0x48,
    0x44,
    0x52, // IHDR
    0x00,
    0x00,
    0x00,
    0x01, // Width: 1
    0x00,
    0x00,
    0x00,
    0x01, // Height: 1
    0x08,
    0x06,
    0x00,
    0x00,
    0x00, // Bit depth, color type, etc
    0x1f,
    0x15,
    0xc4,
    0x89, // CRC
  ]);
  const idat = Buffer.from([
    0x00,
    0x00,
    0x00,
    0x0a, // Length
    0x49,
    0x44,
    0x41,
    0x54, // IDAT
    0x78,
    0x9c,
    0x63,
    0x00,
    0x01,
    0x00,
    0x00,
    0x05,
    0x00,
    0x01,
    0x0d,
    0x0a,
    0x2d,
    0xb4, // CRC
  ]);
  const iend = Buffer.from([
    0x00,
    0x00,
    0x00,
    0x00, // Length
    0x49,
    0x45,
    0x4e,
    0x44, // IEND
    0xae,
    0x42,
    0x60,
    0x82, // CRC
  ]);

  return Buffer.concat([pngSignature, ihdr, idat, iend]);
}

/**
 * Create JPEG image buffer for testing
 */
export function createJpegBuffer(): Buffer {
  // Minimal valid JPEG
  return Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xe0, // JPEG SOI + APP0
    0x00,
    0x10,
    0x4a,
    0x46,
    0x49,
    0x46,
    0x00,
    0x01, // JFIF header
    0x01,
    0x01,
    0x00,
    0x48,
    0x00,
    0x48,
    0x00,
    0x00,
    0xff,
    0xd9, // JPEG EOI
  ]);
}

/**
 * Create WebP image buffer for testing
 */
export function createWebPBuffer(): Buffer {
  // Minimal valid WebP
  return Buffer.from([
    0x52,
    0x49,
    0x46,
    0x46, // 'RIFF'
    0x1a,
    0x00,
    0x00,
    0x00, // File size
    0x57,
    0x45,
    0x42,
    0x50, // 'WEBP'
    0x56,
    0x50,
    0x38,
    0x20, // 'VP8 '
    0x0e,
    0x00,
    0x00,
    0x00, // Chunk size
    0x30,
    0x01,
    0x00,
    0x9d,
    0x01,
    0x2a, // VP8 bitstream
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
  ]);
}
