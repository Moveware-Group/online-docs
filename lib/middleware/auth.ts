/**
 * Authorization Middleware for Admin Routes
 *
 * Provides authentication and authorization checks for protected API routes.
 * Includes CSRF protection, request logging, and role-based access control.
 */

import { NextRequest } from "next/server";

/**
 * User interface matching the auth system
 */
interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "staff";
  name: string;
}

/**
 * Auth error response structure
 */
interface AuthError {
  error: string;
  status: number;
}

/**
 * Extract and validate authorization token from request headers
 */
function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return null;
  }

  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * Validate user session and return user data
 * In production, this would validate JWT tokens and check session store
 */
async function validateSession(token: string): Promise<User | null> {
  // PLACEHOLDER: In production, validate JWT token and fetch user from database
  // For now, we accept the placeholder token from the login endpoint

  if (!token || token === "") {
    return null;
  }

  // Placeholder validation - accept the demo token
  if (token === "placeholder-token") {
    // In a real implementation, decode JWT and fetch user from database
    // For now, return a mock admin user for testing
    return {
      id: "1",
      username: "admin",
      email: "admin@moveware.com",
      role: "admin",
      name: "Admin User",
    };
  }

  // Token not recognized
  return null;
}

/**
 * Validate CSRF protection using Origin/Referer header check
 * Protects against cross-site request forgery attacks
 */
function validateCSRF(request: NextRequest): boolean {
  const method = request.method;

  // Only validate CSRF for state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return true;
  }

  // Get origin and referer headers
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // For API routes, we validate that the request comes from our domain
  // In production, also check against a whitelist of allowed origins

  if (origin) {
    // Extract hostname from origin
    try {
      const originUrl = new URL(origin);
      const requestUrl = new URL(request.url);

      // Check if origin matches our host
      if (originUrl.host !== requestUrl.host) {
        console.warn("CSRF validation failed: Origin mismatch", {
          origin: originUrl.host,
          host: requestUrl.host,
        });
        return false;
      }
    } catch (error) {
      console.error("CSRF validation error parsing origin:", error);
      return false;
    }
  } else if (referer) {
    // Fallback to referer if origin not present
    try {
      const refererUrl = new URL(referer);
      const requestUrl = new URL(request.url);

      if (refererUrl.host !== requestUrl.host) {
        console.warn("CSRF validation failed: Referer mismatch", {
          referer: refererUrl.host,
          host: requestUrl.host,
        });
        return false;
      }
    } catch (error) {
      console.error("CSRF validation error parsing referer:", error);
      return false;
    }
  } else {
    // No origin or referer - could be a direct API call
    // In development, we allow this for testing
    // In production, you might want to reject these
    if (process.env.NODE_ENV === "production") {
      console.warn("CSRF validation warning: No origin or referer header");
    }
  }

  return true;
}

/**
 * Log authentication attempt for audit trail
 */
function logAuthAttempt(
  request: NextRequest,
  success: boolean,
  userId?: string,
  reason?: string,
): void {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const path = new URL(request.url).pathname;
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const logEntry = {
    timestamp,
    method,
    path,
    ip,
    success,
    userId,
    reason,
  };

  if (success) {
    console.log("✓ Auth success:", JSON.stringify(logEntry));
  } else {
    console.warn("✗ Auth failed:", JSON.stringify(logEntry));
  }

  // In production, send to audit logging service (e.g., CloudWatch, Splunk)
  // await auditLogger.log(logEntry);
}

/**
 * Verify user has access to the specified company
 * Used for multi-tenancy access control
 */
async function verifyCompanyAccess(
  userId: string,
  companyId: string,
): Promise<boolean> {
  // PLACEHOLDER: In production, check database for user-company relationships
  // For now, admins have access to all companies
  return true;
}

/**
 * Require Admin Authorization Middleware
 *
 * Validates that the request is authenticated, has admin role,
 * and passes CSRF validation. Returns null if authorized,
 * or an AuthError object if not.
 *
 * @param request - Next.js request object
 * @param companyId - Optional company ID for multi-tenancy checks
 * @returns null if authorized, AuthError if not
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authError = await requireAdmin(request);
 *   if (authError) {
 *     return NextResponse.json(
 *       { success: false, error: authError.error },
 *       { status: authError.status }
 *     );
 *   }
 *   // Protected route logic here
 * }
 * ```
 */
export async function requireAdmin(
  request: NextRequest,
  companyId?: string,
): Promise<AuthError | null> {
  // 1. CSRF Protection (for state-changing methods)
  if (!validateCSRF(request)) {
    logAuthAttempt(request, false, undefined, "CSRF validation failed");
    return {
      error: "Invalid request origin. CSRF validation failed.",
      status: 403,
    };
  }

  // 2. Extract authentication token
  const token = extractToken(request);

  if (!token) {
    logAuthAttempt(request, false, undefined, "No auth token provided");
    return {
      error:
        "Authentication required. Please provide a valid authorization token.",
      status: 401,
    };
  }

  // 3. Validate session and get user
  const user = await validateSession(token);

  if (!user) {
    logAuthAttempt(request, false, undefined, "Invalid auth token");
    return {
      error: "Invalid or expired authentication token.",
      status: 401,
    };
  }

  // 4. Check admin role
  if (user.role !== "admin") {
    logAuthAttempt(
      request,
      false,
      user.id,
      "Insufficient permissions (not admin)",
    );
    return {
      error: "Access denied. Admin privileges required.",
      status: 403,
    };
  }

  // 5. Verify company access if companyId provided
  if (companyId) {
    const hasAccess = await verifyCompanyAccess(user.id, companyId);
    if (!hasAccess) {
      logAuthAttempt(
        request,
        false,
        user.id,
        `No access to company ${companyId}`,
      );
      return {
        error:
          "Access denied. You do not have permission to access this company.",
        status: 403,
      };
    }
  }

  // Success - log and return null (no error)
  logAuthAttempt(request, true, user.id);
  return null;
}

/**
 * Require Authentication (any authenticated user)
 *
 * Less restrictive than requireAdmin - only checks for valid authentication.
 * Useful for routes that need authentication but not admin role.
 *
 * @param request - Next.js request object
 * @returns null if authenticated, AuthError if not
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const authError = await requireAuth(request);
 *   if (authError) {
 *     return NextResponse.json(
 *       { success: false, error: authError.error },
 *       { status: authError.status }
 *     );
 *   }
 *   // Protected route logic here
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest,
): Promise<AuthError | null> {
  // 1. CSRF Protection
  if (!validateCSRF(request)) {
    logAuthAttempt(request, false, undefined, "CSRF validation failed");
    return {
      error: "Invalid request origin. CSRF validation failed.",
      status: 403,
    };
  }

  // 2. Extract authentication token
  const token = extractToken(request);

  if (!token) {
    logAuthAttempt(request, false, undefined, "No auth token provided");
    return {
      error:
        "Authentication required. Please provide a valid authorization token.",
      status: 401,
    };
  }

  // 3. Validate session
  const user = await validateSession(token);

  if (!user) {
    logAuthAttempt(request, false, undefined, "Invalid auth token");
    return {
      error: "Invalid or expired authentication token.",
      status: 401,
    };
  }

  // Success
  logAuthAttempt(request, true, user.id);
  return null;
}

/**
 * Get current authenticated user from request
 *
 * Returns the user object if authenticated, null otherwise.
 * Useful when you need the user data in your route handler.
 *
 * @param request - Next.js request object
 * @returns User object or null
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   const user = await getCurrentUser(request);
 *   if (!user) {
 *     return NextResponse.json(
 *       { error: 'Unauthorized' },
 *       { status: 401 }
 *     );
 *   }
 *   return NextResponse.json({ userId: user.id, role: user.role });
 * }
 * ```
 */
export async function getCurrentUser(
  request: NextRequest,
): Promise<User | null> {
  const token = extractToken(request);
  if (!token) {
    return null;
  }
  return await validateSession(token);
}
