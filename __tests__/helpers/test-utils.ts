import { NextRequest } from "next/server";

/**
 * Test helper utilities for API route testing
 * Test Utilities
 * Helper functions for API route testing
 */

/**
 * Create a mock NextRequest for testing
 * @param url - Request URL
 * @param options - Request options (method, headers, body, etc.)
 */
export function createMockRequest(
  url: string,
  options: RequestInit = {},
): NextRequest {
  return new NextRequest(url, options);
}

/**
 * Create mock params object that matches Next.js route params structure
 * In Next.js 15+, params is a Promise that resolves to the params object
 * @param params - Route parameters object
 * @returns Promise resolving to params object
 */
export function createMockParams<T extends Record<string, string>>(
 * Create mock params for Next.js API routes
 * Wraps params in a Promise as Next.js 13+ requires
 */
export function createMockParams<T extends Record<string, any>>(
  params: T,
): Promise<T> {
  return Promise.resolve(params);
}

/**
 * Parse JSON from NextResponse for testing
 * @param response - Response object from route handler
 * @returns Parsed JSON data
 */
export async function getResponseJson(response: Response): Promise<any> {
  return response.json();
}

/**
 * Create a mock File object for upload testing
 * @param content - File content as string
 * @param filename - Name of the file
 * @param mimeType - MIME type (e.g., 'image/png', 'image/jpeg')
 * @returns Mock File object
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
 * Create a file larger than the specified size for testing size limits
 * Useful for testing file upload size validation (e.g., 2MB max)
 * @param sizeMB - Size in megabytes
 * @returns Large File object
 */
export function createLargeFile(sizeMB: number): File {
  const size = sizeMB * 1024 * 1024;
  const content = "a".repeat(size);
  return createMockFile(content, "large-file.jpg", "image/jpeg");
}

/**
 * Create FormData with a file for upload testing
 * Used for testing multipart/form-data endpoints (e.g., logo upload)
 * @param fieldName - Form field name (e.g., 'logo')
 * @param file - File object to include
 * @returns FormData with file attached
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
 * Uses placeholder token matching auth middleware in lib/middleware/auth.ts
 * @returns Headers object with admin authorization
 */
export function mockAdminHeaders(): Record<string, string> {
  return {
    Authorization: "Bearer admin-token",
    "Content-Type": "application/json",
  };
}

/**
 * Mock staff authentication headers
 * Uses placeholder token matching auth middleware in lib/middleware/auth.ts
 * @returns Headers object with staff authorization
 */
export function mockStaffHeaders(): Record<string, string> {
  return {
    Authorization: "Bearer staff-token",
    "Content-Type": "application/json",
  };
}

/**
 * Mock unauthenticated headers (no auth token)
 * Used for testing endpoints that require authentication
 * @returns Headers object without authorization
 */
export function mockUnauthenticatedHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * Create a real PNG image buffer for testing file uploads
 * This creates an actual valid PNG file (1x1 pixel) for MIME type validation
 * @returns Buffer containing a valid 1x1 PNG image
 */
export function createRealPngBuffer(): Buffer {
  // Minimal valid PNG file (1x1 pixel, transparent)
  return Buffer.from([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // PNG signature
    0x00,
    0x00,
    0x00,
    0x0d,
    0x49,
    0x48,
    0x44,
    0x52, // IHDR chunk
    0x00,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x01, // Width & height: 1x1
    0x08,
    0x06,
    0x00,
    0x00,
    0x00,
    0x1f,
    0x15,
    0xc4, // Bit depth, color type, etc.
    0x89,
    0x00,
    0x00,
    0x00,
    0x0a,
    0x49,
    0x44,
    0x41, // IDAT chunk
    0x54,
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
    0xb4,
    0x00, // Data
    0x00,
    0x00,
    0x00,
    0x49,
    0x45,
    0x4e,
    0x44,
    0xae, // IEND chunk
    0x42,
    0x60,
    0x82,
  ]);
}

/**
 * Create a real JPEG image buffer for testing file uploads
 * This creates an actual valid JPEG file (1x1 pixel) for MIME type validation
 * @returns Buffer containing a valid 1x1 JPEG image
 */
export function createRealJpegBuffer(): Buffer {
  // Minimal valid JPEG file (1x1 pixel)
  return Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x10,
    0x4a,
    0x46, // JPEG signature
    0x49,
    0x46,
    0x00,
    0x01,
    0x01,
    0x00,
    0x00,
    0x01,
    0x00,
    0x01,
    0x00,
    0x00,
    0xff,
    0xdb,
    0x00,
    0x43,
    0x00,
    0x08,
    0x06,
    0x06,
    0x07,
    0x06,
    0x05,
    0x08,
    0x07,
    0x07,
    0x07,
    0x09,
    0x09,
    0x08,
    0x0a,
    0x0c,
    0x14,
    0x0d,
    0x0c,
    0x0b,
    0x0b,
    0x0c,
    0x19,
    0x12,
    0x13,
    0x0f,
    0x14,
    0x1d,
    0x1a,
    0x1f,
    0x1e,
    0x1d,
    0x1a,
    0x1c,
    0x1c,
    0x20,
    0x24,
    0x2e,
    0x27,
    0x20,
    0x22,
    0x2c,
    0x23,
    0x1c,
    0x1c,
    0x28,
    0x37,
    0x29,
    0x2c,
    0x30,
    0x31,
    0x34,
    0x34,
    0x34,
    0x1f,
    0x27,
    0x39,
    0x3d,
    0x38,
    0x32,
    0x3c,
    0x2e,
    0x33,
    0x34,
    0x32,
    0xff,
    0xc0,
    0x00,
    0x0b,
    0x08,
    0x00,
    0x01,
    0x00,
    0x01,
    0x01,
    0x01,
    0x11,
    0x00,
    0xff,
    0xc4,
    0x00,
    0x14,
    0x00,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x03,
    0xff,
    0xc4,
    0x00,
    0x14,
    0x10,
    0x01,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0x00,
    0xff,
    0xda,
    0x00,
    0x08,
    0x01,
    0x01,
    0x00,
    0x00,
    0x3f,
    0x00,
    0x7f,
    0x9f,
    0xff,
    0xd9,
  ]);

/**
 * Extract JSON from Response object
 */
export async function getResponseJson(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse response as JSON:", text);
    throw error;
  }
}

/**
 * Create a mock File object for testing file uploads
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
 * Create a large file for testing file size limits
 */
export function createLargeFile(
  filename: string,
  sizeInMB: number,
  mimeType: string,
): File {
  const size = sizeInMB * 1024 * 1024;
  const content = "x".repeat(size);
  return createMockFile(filename, content, mimeType);
}

/**
 * Create FormData with a file for multipart/form-data testing
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
 * Mock headers for admin user requests
 */
export function mockAdminHeaders(): Record<string, string> {
  return {
    authorization: "Bearer placeholder-token",
    "content-type": "application/json",
  };
}

/**
 * Mock headers for staff user requests
 */
export function mockStaffHeaders(): Record<string, string> {
  return {
    authorization: "Bearer staff-token",
    "content-type": "application/json",
  };
}

/**
 * Mock headers for unauthenticated requests
 */
export function mockUnauthenticatedHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
  };
}

/**
 * Create a mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {},
): NextRequest {
  const { method = "GET", headers = {}, body } = options;

  const request = new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  return request;
}
