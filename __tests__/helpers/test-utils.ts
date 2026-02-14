/**
 * Test utility functions for API testing
 */

import { NextRequest } from "next/server";

/**
 * Creates mock params for Next.js route handlers
 * @param params - Object with parameter key-value pairs
 * @returns Promise resolving to params object
 */
export function createMockParams(
  params: Record<string, string>,
): Promise<Record<string, string>> {
  return Promise.resolve(params);
}

/**
 * Parses JSON from a Response object
 * @param response - Response object to parse
 * @returns Parsed JSON data
 */
export async function getResponseJson(response: Response): Promise<any> {
  return await response.json();
}

/**
 * Creates a mock File object for testing
 * @param content - File content as string
 * @param filename - Name of the file
 * @param mimeType - MIME type of the file
 * @returns File object
 */
export function createMockFile(
  content: string,
  filename: string,
  mimeType: string,
): File {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

/**
 * Creates a large file (> 2MB) for testing file size limits
 * @returns File object exceeding size limit
 */
export function createLargeFile(): File {
  const size = 3 * 1024 * 1024; // 3MB - exceeds 2MB limit
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type: "image/png" });
  return new File([blob], "large-image.png", { type: "image/png" });
}

/**
 * Creates FormData with a file
 * @param file - File to add to FormData
 * @param fieldName - Field name for the file (default: 'logo')
 * @returns FormData with file attached
 */
export function createFormDataWithFile(
  file: File,
  fieldName: string = "logo",
): FormData {
  const formData = new FormData();
  formData.append(fieldName, file);
  return formData;
}

/**
 * Mock authorization headers for admin user
 * Uses placeholder token matching auth middleware
 * @returns Headers object with admin authorization
 */
export function mockAdminHeaders(): Record<string, string> {
  return {
    Authorization: "Bearer admin-token",
    "Content-Type": "application/json",
  };
}

/**
 * Mock authorization headers for staff user
 * Uses placeholder token matching auth middleware
 * @returns Headers object with staff authorization
 */
export function mockStaffHeaders(): Record<string, string> {
  return {
    Authorization: "Bearer staff-token",
    "Content-Type": "application/json",
  };
}

/**
 * Mock headers for unauthenticated requests
 * @returns Headers object without authorization
 */
export function mockUnauthenticatedHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Creates a mock PNG file with valid PNG signature
 * @param sizeInBytes - Size of file in bytes (default: 1KB)
 * @returns File object with PNG MIME type
 */
export function createMockPngFile(sizeInBytes: number = 1024): File {
  // PNG file signature: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = new Uint8Array([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);
  const buffer = new Uint8Array(sizeInBytes);
  buffer.set(pngSignature);
  const blob = new Blob([buffer], { type: "image/png" });
  return new File([blob], "test.png", { type: "image/png" });
}

/**
 * Creates a mock JPEG file with valid JPEG signature
 * @param sizeInBytes - Size of file in bytes (default: 1KB)
 * @returns File object with JPEG MIME type
 */
export function createMockJpegFile(sizeInBytes: number = 1024): File {
  // JPEG file signature: FF D8 FF
  const jpegSignature = new Uint8Array([0xff, 0xd8, 0xff]);
  const buffer = new Uint8Array(sizeInBytes);
  buffer.set(jpegSignature);
  const blob = new Blob([buffer], { type: "image/jpeg" });
  return new File([blob], "test.jpg", { type: "image/jpeg" });
}

/**
 * Creates a mock WebP file with valid WebP signature
 * @param sizeInBytes - Size of file in bytes (default: 1KB)
 * @returns File object with WebP MIME type
 */
export function createMockWebPFile(sizeInBytes: number = 1024): File {
  // WebP file signature: RIFF....WEBP
  const riffSignature = new Uint8Array([0x52, 0x49, 0x46, 0x46]); // RIFF
  const webpSignature = new Uint8Array([0x57, 0x45, 0x42, 0x50]); // WEBP
  const buffer = new Uint8Array(sizeInBytes);
  buffer.set(riffSignature);
  buffer.set(webpSignature, 8);
  const blob = new Blob([buffer], { type: "image/webp" });
  return new File([blob], "test.webp", { type: "image/webp" });
}
