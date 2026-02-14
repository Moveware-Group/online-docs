/**
 * Test Utilities
 * Helper functions for API route testing
 */

/**
 * Create mock params object for dynamic routes
 * @param params - The params to mock (e.g., { id: '123' })
 * @returns Promise that resolves to params
 */
export function createMockParams(
  params: Record<string, string>,
): Promise<Record<string, string>> {
  return Promise.resolve(params);
}

/**
 * Get JSON from NextResponse
 * @param response - The NextResponse object
 * @returns The parsed JSON data
 */
export async function getResponseJson(response: any): Promise<any> {
  // NextResponse has a json() method
  if (typeof response.json === "function") {
    return await response.json();
  }
  // Fallback if it's already parsed
  return response;
}

/**
 * Create a mock File object for testing
 * @param sizeInBytes - Size of the file in bytes
 * @param mimeType - MIME type (default: 'image/png')
 * @param filename - Filename (default: 'test-logo.png')
 * @returns Mock File object
 */
export function createMockFile(
  sizeInBytes: number = 1024 * 100, // 100KB default
  mimeType: string = "image/png",
  filename: string = "test-logo.png",
): File {
  // Create a buffer of the specified size
  const buffer = Buffer.alloc(sizeInBytes);

  // For PNG files, add a valid PNG header to pass MIME sniffing
  if (mimeType === "image/png") {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);
    pngHeader.copy(buffer, 0);
  } else if (mimeType === "image/jpeg") {
    // JPEG magic bytes: FF D8 FF
    const jpegHeader = Buffer.from([0xff, 0xd8, 0xff]);
    jpegHeader.copy(buffer, 0);
  } else if (mimeType === "image/webp") {
    // WebP magic bytes: RIFF....WEBP
    const webpHeader = Buffer.from("RIFF", "ascii");
    webpHeader.copy(buffer, 0);
    const webpMarker = Buffer.from("WEBP", "ascii");
    webpMarker.copy(buffer, 8);
  }

  // Create a Blob from the buffer
  const blob = new Blob([buffer], { type: mimeType });

  // Create a File from the Blob
  const file = new File([blob], filename, { type: mimeType });

  return file;
}

/**
 * Create a large file (>2MB) for testing file size validation
 * @param mimeType - MIME type (default: 'image/png')
 * @returns Mock File object larger than 2MB
 */
export function createLargeFile(mimeType: string = "image/png"): File {
  const twoMBPlus = 2 * 1024 * 1024 + 1024; // 2MB + 1KB
  return createMockFile(twoMBPlus, mimeType, "large-file.png");
}

/**
 * Create FormData with a file for multipart upload testing
 * @param file - The file to include
 * @param fieldName - Form field name (default: 'logo')
 * @returns FormData object
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
 * Create mock admin authorization headers
 * Uses placeholder token matching auth middleware
 * @returns Headers object with admin token
 */
export function mockAdminHeaders(): Record<string, string> {
  return {
    Authorization: "Bearer admin-token",
    "Content-Type": "application/json",
  };
}

/**
 * Create mock staff authorization headers
 * Uses placeholder token matching auth middleware
 * @returns Headers object with staff token
 */
export function mockStaffHeaders(): Record<string, string> {
  return {
    Authorization: "Bearer staff-token",
    "Content-Type": "application/json",
  };
}

/**
 * Create mock unauthenticated headers (no token)
 * @returns Headers object without authorization
 */
export function mockUnauthenticatedHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}
