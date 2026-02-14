/**
 * Test utilities for Next.js API routes and components
 */

import { NextRequest } from "next/server";

/**
 * Creates mock route params for testing
 */
export function createMockParams(
  params: Record<string, string>,
): Promise<Record<string, string>> {
  return Promise.resolve(params);
}

/**
 * Helper to extract JSON from NextResponse
 */
export async function getResponseJson(response: Response): Promise<any> {
  return response.json();
}

/**
 * Creates a mock File object for testing uploads
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
 * Creates a large file for testing size limits
 */
export function createLargeFile(sizeInMB: number): File {
  const size = sizeInMB * 1024 * 1024;
  const buffer = new ArrayBuffer(size);
  const blob = new Blob([buffer], { type: "image/png" });
  return new File([blob], "large-file.png", { type: "image/png" });
}

/**
 * Creates FormData with a file for testing multipart uploads
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
 * Mock admin authorization headers
 */
export function mockAdminHeaders(): Record<string, string> {
  return {
    authorization: "Bearer admin-token",
    "content-type": "application/json",
  };
}

/**
 * Mock staff authorization headers
 */
export function mockStaffHeaders(): Record<string, string> {
  return {
    authorization: "Bearer staff-token",
    "content-type": "application/json",
  };
}

/**
 * Mock unauthenticated headers
 */
export function mockUnauthenticatedHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
  };
}
