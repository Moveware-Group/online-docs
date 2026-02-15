/**
 * Test Utilities
 * Helper functions for API route testing
 */

import { NextRequest } from "next/server";

/**
 * Create mock params for Next.js API routes
 * Wraps params in a Promise as Next.js 13+ requires
 */
export function createMockParams<T extends Record<string, any>>(
  params: T,
): Promise<T> {
  return Promise.resolve(params);
}

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
