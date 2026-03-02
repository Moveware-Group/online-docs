import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword } from '@/lib/auth/password';
import { generateToken, tokenExpiry } from '@/lib/auth/session';
import type { LoginCredentials, LoginResponse } from '@/lib/types/auth';

/**
 * POST /api/auth/login
 *
 * Priority:
 *   1. Check the `users` table (DB users with hashed passwords)
 *   2. Fall back to ADMIN_USERNAME / ADMIN_PASSWORD env vars (break-glass)
 */
export async function POST(request: NextRequest) {
  try {
    const credentials: LoginCredentials = await request.json();

    if (!credentials.username || !credentials.password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' } as LoginResponse,
        { status: 400 },
      );
    }

    // ── 1. Database user lookup ──────────────────────────────────────────────
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbUser = await (prisma as any).user.findUnique({
        where: { username: credentials.username },
        include: {
          role: true,
          companies: { select: { companyId: true } },
        },
      });

      if (dbUser && dbUser.isActive) {
        const valid = await comparePassword(credentials.password, dbUser.passwordHash);
        if (valid) {
          const token = generateToken();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (prisma as any).userSession.create({
            data: {
              userId: dbUser.id,
              token,
              expiresAt: tokenExpiry(),
            },
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const permissions: string[] = JSON.parse(dbUser.role?.permissions ?? '[]') as string[];
          const isAdmin = permissions.includes('all');

          return NextResponse.json({
            success: true,
            token,
            user: {
              id: dbUser.id,
              username: dbUser.username,
              email: dbUser.email ?? null,
              name: dbUser.name,
              role: isAdmin ? 'admin' : 'client',
              roleId: dbUser.roleId,
              roleName: dbUser.role?.name ?? '',
              permissions,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              companyIds: (dbUser.companies as any[]).map((c: { companyId: string }) => c.companyId),
              isAdmin,
            },
            message: 'Login successful',
          } as LoginResponse);
        }
      }
    } catch {
      // DB not available or users table not yet created — fall through to env-var check
    }

    // ── 2. Break-glass env-var admin ─────────────────────────────────────────
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (
      credentials.username === adminUsername &&
      credentials.password === adminPassword
    ) {
      return NextResponse.json({
        success: true,
        user: {
          id: 'env-admin',
          username: adminUsername,
          email: null,
          role: 'admin',
          name: 'Admin User',
          roleId: 'role_admin',
          roleName: 'Admin',
          permissions: ['all'],
          companyIds: [],
          isAdmin: true,
        },
        token: 'placeholder-token',
        message: 'Login successful',
      } as LoginResponse);
    }

    return NextResponse.json(
      { success: false, message: 'Invalid username or password' } as LoginResponse,
      { status: 401 },
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' } as LoginResponse,
      { status: 500 },
    );
  }
}
