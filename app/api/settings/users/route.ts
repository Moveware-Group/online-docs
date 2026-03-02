/**
 * GET  /api/settings/users  — list all users (admin only)
 * POST /api/settings/users  — create a new user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session?.isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const users = await (prisma as any).user.findMany({
      orderBy: { name: 'asc' },
      include: {
        role: { select: { id: true, name: true } },
        companies: {
          include: { company: { select: { id: true, name: true, tenantId: true } } },
        },
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = users.map((u: any) => ({
      id: u.id,
      username: u.username,
      email: u.email ?? null,
      name: u.name,
      roleId: u.roleId,
      roleName: u.role?.name ?? '',
      isActive: u.isActive,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      companies: (u.companies as any[]).map((uc: any) => ({
        id: uc.company.id,
        name: uc.company.name,
        tenantId: uc.company.tenantId,
      })),
      createdAt: u.createdAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session?.isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  try {
    const { username, email, name, password, roleId, companyIds, isActive } = await request.json();

    if (!username?.trim()) return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    if (!password || password.length < 8) return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });
    if (!roleId) return NextResponse.json({ success: false, error: 'Role is required' }, { status: 400 });

    const passwordHash = await hashPassword(password);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma as any).user.create({
      data: {
        username: username.trim(),
        email: email?.trim() || null,
        name: name.trim(),
        passwordHash,
        roleId,
        isActive: isActive !== false,
        companies: {
          create: (Array.isArray(companyIds) ? companyIds : []).map((cid: string) => ({
            companyId: cid,
          })),
        },
      },
      include: {
        role: { select: { id: true, name: true } },
        companies: {
          include: { company: { select: { id: true, name: true, tenantId: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email ?? null,
        name: user.name,
        roleId: user.roleId,
        roleName: user.role?.name ?? '',
        isActive: user.isActive,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        companies: (user.companies as any[]).map((uc: any) => ({
          id: uc.company.id,
          name: uc.company.name,
          tenantId: uc.company.tenantId,
        })),
      },
    });
  } catch (error) {
    console.error('POST users error:', error);
    const msg = error instanceof Error && error.message.includes('Unique constraint')
      ? 'Username or email already exists'
      : 'Failed to create user';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
