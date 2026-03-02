/**
 * Server-side session helpers.
 * Validates Bearer tokens from the Authorization header against UserSession table.
 */

import { randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import type { NextRequest } from 'next/server';

const SESSION_TTL_DAYS = 30;

/** Generate a cryptographically random session token. */
export function generateToken(): string {
  return randomBytes(48).toString('hex');
}

/** Session expiry date — SESSION_TTL_DAYS from now. */
export function tokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + SESSION_TTL_DAYS);
  return d;
}

export interface SessionUser {
  id: string;
  username: string;
  email: string | null;
  name: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  companyIds: string[];
  isAdmin: boolean;
}

/**
 * Extract and validate the Bearer token from an incoming request.
 * Returns the resolved SessionUser, or null if invalid/expired.
 *
 * Also accepts the legacy 'placeholder-token' so the env-var admin
 * continues to work without a DB row.
 */
export async function getSessionUser(
  request: NextRequest,
): Promise<SessionUser | null> {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  // Legacy break-glass admin (env-var login)
  if (token === 'placeholder-token') {
    return {
      id: 'env-admin',
      username: process.env.ADMIN_USERNAME || 'admin',
      email: null,
      name: 'Admin User',
      roleId: 'role_admin',
      roleName: 'Admin',
      permissions: ['all'],
      companyIds: [],
      isAdmin: true,
    };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await (prisma as any).userSession.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            role: true,
            companies: { select: { companyId: true } },
          },
        },
      },
    });

    if (!session) return null;
    if (new Date(session.expiresAt) < new Date()) return null;
    if (!session.user?.isActive) return null;

    const user = session.user;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const permissions: string[] = JSON.parse(user.role?.permissions ?? '[]') as string[];
    const isAdmin = permissions.includes('all');

    return {
      id: user.id,
      username: user.username,
      email: user.email ?? null,
      name: user.name,
      roleId: user.roleId,
      roleName: user.role?.name ?? '',
      permissions,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      companyIds: (user.companies as any[]).map((c: { companyId: string }) => c.companyId),
      isAdmin,
    };
  } catch {
    return null;
  }
}

/** Delete a session token (logout). */
export async function deleteSession(token: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).userSession.deleteMany({ where: { token } });
  } catch {
    // silently ignore — session may have already expired
  }
}
