/**
 * Test utilities for API testing
 */

import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
  } = {},
): NextRequest {
  const { method = "GET", headers = {}, body, signal } = options;

  // Build headers object - use Record<string, string> instead of HeadersInit
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Build request init options
  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    // Signal must be AbortSignal | undefined, NOT null
    signal: signal,
  };

  // Create and return NextRequest
  return new NextRequest(url, requestInit);
}

/**
 * Create a mock response helper
 */
export function createMockResponse(data: any, status = 200) {
  return {
    json: () => Promise.resolve(data),
    status,
    ok: status >= 200 && status < 300,
  };
}

/**
 * Extract JSON from NextResponse
 */
export async function extractJSON(response: Response) {
  return await response.json();
}
