/**
 * GET  /api/settings/roles  — list all roles
 * POST /api/settings/roles  — create a new role (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles = await (prisma as any).role.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true } } },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = roles.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description ?? '',
      permissions: JSON.parse(r.permissions ?? '[]') as string[],
      isSystem: r.isSystem,
      userCount: r._count.users,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('GET roles error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch roles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionUser(request);
  if (!session?.isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  try {
    const { name, description, permissions } = await request.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const role = await (prisma as any).role.create({
      data: {
        name: name.trim(),
        description: description?.trim() ?? null,
        permissions: JSON.stringify(Array.isArray(permissions) ? permissions : []),
        isSystem: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: role.id,
        name: role.name,
        description: role.description ?? '',
        permissions: JSON.parse(role.permissions) as string[],
        isSystem: role.isSystem,
        userCount: 0,
      },
    });
  } catch (error) {
    console.error('POST roles error:', error);
    const msg = error instanceof Error && error.message.includes('Unique constraint')
      ? 'A role with this name already exists'
      : 'Failed to create role';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
