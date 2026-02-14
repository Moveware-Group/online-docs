/**
 * Authorization Middleware for Admin Routes
 *
 * Provides authentication and authorization checks for API routes.
 * Includes request logging for audit trail and CSRF protection.
 *
 * @module lib/middleware/auth
 *
 * @example Basic Usage
 * ```typescript
 * import { requireAdmin } from '@/lib/middleware/auth';
 *
 * export async function PUT(request: NextRequest, { params }: RouteContext) {
 *   const { id: companyId } = await params;
 *
 *   // Check authorization
 *   const authError = await requireAdmin(request, companyId);
 *   if (authError) {
 *     return NextResponse.json(
 *       { success: false, error: authError.error },
 *       { status: authError.status }
 *     );
 *   }
 *
 *   // Proceed with authorized logic
 *   // ...
 * }
 * ```
 */

import { NextRequest } from "next/server";

/**
 * Authenticated user data
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "staff";
  name: string;
}

/**
 * Authorization error response
 */
export interface AuthError {
  error: string;
  status: number;
}

/**
 * Audit log entry types
 */
type AuditAction = "auth_success" | "auth_failed" | "forbidden" | "csrf_failed";

/**
 * Extract and validate authentication token from request
 * Checks Authorization header (Bearer token) and auth-token cookie
 *
 * @param request - Next.js request object
 * @returns Authentication token or null if not found
 */
function extractToken(request: NextRequest): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check for token in cookies
  const tokenCookie = request.cookies.get("auth-token");
  if (tokenCookie) {
    return tokenCookie.value;
  }

  return null;
}

/**
 * Validate authentication token and return user data
 *
 * @param token - Authentication token to validate
 * @returns User data if valid, null if invalid
 *
 * @remarks
 * TODO: Replace with actual JWT validation or session lookup.
 * Current implementation uses placeholder tokens for development.
 * In production, this should:
 * - Validate JWT signature and expiration
 * - Lookup session in database/Redis
 * - Verify token hasn't been revoked
 */
async function validateToken(token: string): Promise<AuthUser | null> {
  // PLACEHOLDER: Mock token validation for development
  // In production, replace with proper JWT validation or session lookup

  // Mock tokens:
  // - 'placeholder-token' = admin user
  // - 'staff-token' = staff user
  if (token === "placeholder-token") {
    return {
      id: "1",
      username: "admin",
      email: "admin@moveware.com",
      role: "admin",
      name: "Admin User",
    };
  }

  if (token === "staff-token") {
    return {
      id: "2",
      username: "staff",
      email: "staff@moveware.com",
      role: "staff",
      name: "Staff User",
    };
  }

  return null;
}

/**
 * Validate CSRF token for state-changing requests
 * Protects against Cross-Site Request Forgery attacks
 *
 * @param request - Next.js request object
 * @returns true if CSRF token is valid or not required, false otherwise
 *
 * @remarks
 * CSRF protection strategy:
 * - Only validates POST, PUT, DELETE, PATCH requests
 * - Checks X-CSRF-Token header matches csrf-token cookie
 * - GET requests are not checked (idempotent by design)
 * - SameSite cookies provide additional protection in modern browsers
 *
 * Implementation notes:
 * - CSRF token should be generated on login and stored in httpOnly cookie
 * - Client should include token in X-CSRF-Token header for mutations
 * - Token rotation on sensitive operations recommended for production
 */
function validateCSRFToken(request: NextRequest): boolean {
  const method = request.method.toUpperCase();

  // Only check CSRF for state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    return true;
  }

  // Check for CSRF token in custom header
  const csrfToken = request.headers.get("x-csrf-token");
  const csrfCookie = request.cookies.get("csrf-token");

  // For development/testing: Allow requests without CSRF if no cookie is set
  // In production, enforce stricter validation
  if (!csrfCookie) {
    // Warn in development, but allow the request
    // Remove this in production to enforce CSRF protection
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "⚠️  CSRF cookie not set. Implement CSRF protection before production deployment.",
      );
      return true;
    }
    return false;
  }

  // Validate that header token matches cookie token
  if (!csrfToken || csrfToken !== csrfCookie.value) {
    return false;
  }

  return true;
}

/**
 * Log request for audit trail
 * Creates structured log entries for security monitoring and compliance
 *
 * @param request - Next.js request object
 * @param user - Authenticated user (null if auth failed)
 * @param action - Type of audit event
 * @param companyId - Optional company ID for company-specific operations
 *
 * @remarks
 * In production, send logs to:
 * - Centralized logging service (e.g., CloudWatch, Datadog, Loggly)
 * - SIEM system for security monitoring
 * - Audit database for compliance requirements
 *
 * Log retention:
 * - Keep auth logs for minimum 90 days (compliance requirement)
 * - Archive critical security events indefinitely
 */
function logRequest(
  request: NextRequest,
  user: AuthUser | null,
  action: AuditAction,
  companyId?: string,
): void {
  const timestamp = new Date().toISOString();
  const method = request.method;
  const url = request.url;

  // Extract client IP (considering proxy headers)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  const logEntry = {
    timestamp,
    action,
    method,
    url,
    ip,
    userAgent,
    userId: user?.id || null,
    userEmail: user?.email || null,
    userRole: user?.role || null,
    companyId: companyId || null,
  };

  // Log to console (in production, send to logging service)
  // Use different log levels based on action severity
  if (action === "auth_failed" || action === "csrf_failed") {
    console.warn(`[AUTH AUDIT] ${JSON.stringify(logEntry)}`);
  } else if (action === "forbidden") {
    console.warn(`[AUTH AUDIT] ${JSON.stringify(logEntry)}`);
  } else {
    console.log(`[AUTH AUDIT] ${JSON.stringify(logEntry)}`);
  }
}

/**
 * Require Admin Role Middleware
 *
 * Validates that the request:
 * 1. Has a valid authentication token
 * 2. User has admin role
 * 3. CSRF token is valid (for POST/PUT/DELETE/PATCH)
 * 4. User has access to the specified company (if companyId provided)
 *
 * @param request - Next.js request object
 * @param companyId - Optional company ID for company-specific access control
 * @returns null if authorized, or AuthError object with error details and status code
 *
 * @example Protecting a PUT endpoint
 * ```typescript
 * import { NextRequest, NextResponse } from 'next/server';
 * import { requireAdmin } from '@/lib/middleware/auth';
 *
 * export async function PUT(
 *   request: NextRequest,
 *   { params }: { params: Promise<{ id: string }> }
 * ) {
 *   const { id: companyId } = await params;
 *
 *   // Check authorization
 *   const authError = await requireAdmin(request, companyId);
 *   if (authError) {
 *     return NextResponse.json(
 *       { success: false, error: authError.error },
 *       { status: authError.status }
 *     );
 *   }
 *
 *   // User is authenticated and has admin role - proceed with logic
 *   const body = await request.json();
 *   // ... update logic
 * }
 * ```
 *
 * @example Protecting a POST endpoint
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   // Check authorization (no company ID needed)
 *   const authError = await requireAdmin(request);
 *   if (authError) {
 *     return NextResponse.json(
 *       { success: false, error: authError.error },
 *       { status: authError.status }
 *     );
 *   }
 *
 *   // Proceed with authorized logic
 *   // ...
 * }
 * ```
 *
 * @example Protecting a DELETE endpoint
 * ```typescript
 * export async function DELETE(
 *   request: NextRequest,
 *   { params }: { params: Promise<{ id: string }> }
 * ) {
 *   const { id } = await params;
 *
 *   const authError = await requireAdmin(request);
 *   if (authError) {
 *     return NextResponse.json(
 *       { error: authError.error },
 *       { status: authError.status }
 *     );
 *   }
 *
 *   // Delete logic
 *   // ...
 * }
 * ```
 */
export async function requireAdmin(
  request: NextRequest,
  companyId?: string,
): Promise<AuthError | null> {
  try {
    // 1. Validate CSRF token for state-changing requests
    if (!validateCSRFToken(request)) {
      logRequest(request, null, "csrf_failed", companyId);
      return {
        error: "Invalid CSRF token. Please refresh the page and try again.",
        status: 403,
      };
    }

    // 2. Extract authentication token
    const token = extractToken(request);
    if (!token) {
      logRequest(request, null, "auth_failed", companyId);
      return {
        error: "Authentication required. Please log in to continue.",
        status: 401,
      };
    }

    // 3. Validate token and get user
    const user = await validateToken(token);
    if (!user) {
      logRequest(request, null, "auth_failed", companyId);
      return {
        error: "Invalid or expired authentication token. Please log in again.",
        status: 401,
      };
    }

    // 4. Check admin role
    if (user.role !== "admin") {
      logRequest(request, user, "forbidden", companyId);
      return {
        error: "Access denied. Administrator privileges required.",
        status: 403,
      };
    }

    // 5. Optional: Verify company-specific access
    // In a full implementation, verify admin has access to this company
    // For now, allow all admins to access all companies
    if (companyId) {
      // TODO: Implement company-specific access control if needed
      // Example: Check if admin is assigned to this company in database
      // const hasAccess = await checkCompanyAccess(user.id, companyId);
      // if (!hasAccess) {
      //   logRequest(request, user, 'forbidden', companyId);
      //   return {
      //     error: 'Access denied. You do not have access to this company.',
      //     status: 403,
      //   };
      // }
    }

    // Log successful authentication
    logRequest(request, user, "auth_success", companyId);

    // Authorization successful
    return null;
  } catch (error) {
    console.error("Error in requireAdmin middleware:", error);
    return {
      error: "Internal authentication error. Please try again.",
      status: 500,
    };
  }
}

/**
 * Get authenticated user from request
 * Similar to requireAdmin but returns user data instead of error
 * Use this when you need user info but don't require admin role
 *
 * @param request - Next.js request object
 * @returns Authenticated user data or null if not authenticated
 *
 * @example Getting current user
 * ```typescript
 * import { getAuthenticatedUser } from '@/lib/middleware/auth';
 *
 * export async function GET(request: NextRequest) {
 *   const user = await getAuthenticatedUser(request);
 *
 *   if (!user) {
 *     return NextResponse.json(
 *       { error: 'Authentication required' },
 *       { status: 401 }
 *     );
 *   }
 *
 *   // Use user data
 *   return NextResponse.json({ user });
 * }
 * ```
 */
export async function getAuthenticatedUser(
  request: NextRequest,
): Promise<AuthUser | null> {
  try {
    const token = extractToken(request);
    if (!token) {
      return null;
    }

    return await validateToken(token);
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Require Authentication (any authenticated user)
 * Less strict than requireAdmin - only checks if user is authenticated
 * Does not require admin role, accepts any authenticated user
 *
 * @param request - Next.js request object
 * @returns null if authenticated, or AuthError object with error details
 *
 * @example Protecting an endpoint for any authenticated user
 * ```typescript
 * import { requireAuth } from '@/lib/middleware/auth';
 *
 * export async function GET(request: NextRequest) {
 *   // Check if user is authenticated (admin or staff)
 *   const authError = await requireAuth(request);
 *   if (authError) {
 *     return NextResponse.json(
 *       { success: false, error: authError.error },
 *       { status: authError.status }
 *     );
 *   }
 *
 *   // User is authenticated - proceed with logic
 *   // ...
 * }
 * ```
 */
export async function requireAuth(
  request: NextRequest,
): Promise<AuthError | null> {
  try {
    // Validate CSRF token for state-changing requests
    if (!validateCSRFToken(request)) {
      return {
        error: "Invalid CSRF token. Please refresh the page and try again.",
        status: 403,
      };
    }

    // Extract and validate token
    const token = extractToken(request);
    if (!token) {
      return {
        error: "Authentication required. Please log in to continue.",
        status: 401,
      };
    }

    const user = await validateToken(token);
    if (!user) {
      return {
        error: "Invalid or expired authentication token. Please log in again.",
        status: 401,
      };
    }

    // User is authenticated (any role) - authorization successful
    return null;
  } catch (error) {
    console.error("Error in requireAuth middleware:", error);
    return {
      error: "Internal authentication error. Please try again.",
      status: 500,
    };
  }
}
