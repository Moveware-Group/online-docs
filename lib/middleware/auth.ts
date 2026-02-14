import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Authentication and Authorization Middleware
 *
 * TODO: Replace with Azure AD B2C token verification
 * Current implementation uses placeholder tokens for development
 */

export interface AuthUser {
  id: string;
  email: string;
  role: "admin" | "staff" | "user";
  companyId: string;
  name: string;
}

export interface AuthResult {
  authenticated: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Extract and verify authentication token from request
 *
 * @param request - Next.js request object
 * @returns Authentication result with user data
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        authenticated: false,
        error: "Missing or invalid authorization header",
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      return {
        authenticated: false,
        error: "No token provided",
      };
    }

    // TODO: Replace with Azure AD B2C JWT verification
    // For now, using placeholder token system
    // In production:
    // 1. Decode JWT token
    // 2. Verify signature with Azure AD B2C public keys
    // 3. Validate issuer, audience, expiration
    // 4. Extract claims (sub, email, roles, tenant_id)

    // PLACEHOLDER IMPLEMENTATION
    // Map placeholder tokens to user data
    const placeholderUsers: Record<string, AuthUser> = {
      "admin-token": {
        id: "1",
        email: "admin@moveware.com",
        role: "admin",
        companyId: "default",
        name: "Admin User",
      },
      "staff-token": {
        id: "2",
        email: "staff@moveware.com",
        role: "staff",
        companyId: "default",
        name: "Staff User",
      },
    };

    const user = placeholderUsers[token];

    if (!user) {
      return {
        authenticated: false,
        error: "Invalid or expired token",
      };
    }

    return {
      authenticated: true,
      user,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      authenticated: false,
      error: "Authentication failed",
    };
  }
}

/**
 * Verify user has admin role
 *
 * @param user - Authenticated user
 * @returns True if user is admin
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === "admin";
}

/**
 * Verify user has access to specified company (tenant isolation)
 *
 * @param user - Authenticated user
 * @param companyId - Company ID to check access for
 * @returns True if user has access to the company
 */
export function hasCompanyAccess(user: AuthUser, companyId: string): boolean {
  // In multi-tenant setup, user can only access their own company
  // Admins might have access to multiple companies based on business rules
  return user.companyId === companyId;
}

/**
 * Verify company exists in database
 *
 * @param companyId - Company ID to verify
 * @returns True if company exists
 */
export async function companyExists(companyId: string): Promise<boolean> {
  try {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });
    return !!company;
  } catch (error) {
    console.error("Error checking company existence:", error);
    return false;
  }
}

/**
 * Middleware to require authentication and admin role
 * Usage: const authResult = await requireAdmin(request, companyId)
 *
 * @param request - Next.js request object
 * @param companyId - Company ID to verify access for
 * @returns Auth result or null if authorized
 */
export async function requireAdmin(
  request: NextRequest,
  companyId: string,
): Promise<{ error: string; status: number } | null> {
  // Verify authentication
  const authResult = await verifyAuth(request);

  if (!authResult.authenticated || !authResult.user) {
    return {
      error: "Authentication required. Please provide a valid access token.",
      status: 401,
    };
  }

  const user = authResult.user;

  // Verify admin role
  if (!isAdmin(user)) {
    return {
      error: "Insufficient permissions. Admin role required.",
      status: 403,
    };
  }

  // Verify company exists
  const exists = await companyExists(companyId);
  if (!exists) {
    return {
      error: "Company not found",
      status: 404,
    };
  }

  // Verify tenant isolation
  if (!hasCompanyAccess(user, companyId)) {
    return {
      error:
        "Access denied. You do not have permission to access this company.",
      status: 403,
    };
  }

  // All checks passed
  return null;
}
