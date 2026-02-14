import { NextRequest } from "next/server";

/**
 * Create a NextRequest with normalized headers.
 * Ensures headers are always a valid Headers instance to satisfy RequestInit types.
 */
export function createNextRequest(
  url: string,
  init: RequestInit = {},
): NextRequest {
  const headers =
    init.headers instanceof Headers ? init.headers : new Headers(init.headers);

  return new NextRequest(url, {
    ...init,
    headers,
  });
}

/**
 * Create a JSON request with Content-Type set.
 */
export function createJsonRequest(
  url: string,
  body: unknown,
  init: RequestInit = {},
): NextRequest {
  const headers =
    init.headers instanceof Headers ? init.headers : new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  return createNextRequest(url, {
    ...init,
    method: init.method ?? "POST",
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Create a FormData request.
 */
export function createFormDataRequest(
  url: string,
  formData: FormData,
  init: RequestInit = {},
): NextRequest {
  return createNextRequest(url, {
    ...init,
    method: init.method ?? "POST",
    body: formData,
  });
}

/**
 * Create a route context with params as a resolved Promise
 * to match Next.js App Router handler signatures.
 */
export function createRouteContext(params: Record<string, string>) {
  return {
    params: Promise.resolve(params),
  };
}
