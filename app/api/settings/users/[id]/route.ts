/**
 * PUT    /api/settings/users/[id]  — update user (admin only)
 * DELETE /api/settings/users/[id]  — delete user (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { getSessionUser } from '@/lib/auth/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser(request);
  if (!session?.isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    const { username, email, name, password, roleId, companyIds, isActive } = await request.json();

    if (!username?.trim()) return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    if (!roleId) return NextResponse.json({ success: false, error: 'Role is required' }, { status: 400 });
    if (password && password.length < 8) return NextResponse.json({ success: false, error: 'Password must be at least 8 characters' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    const updateData: Record<string, unknown> = {
      username: username.trim(),
      email: email?.trim() || null,
      name: name.trim(),
      roleId,
      isActive: isActive !== false,
    };
    if (password) {
      updateData.passwordHash = await hashPassword(password);
    }

    // Replace company assignments
    const newCompanyIds: string[] = Array.isArray(companyIds) ? companyIds : [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).userCompany.deleteMany({ where: { userId: id } });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = await (prisma as any).user.update({
      where: { id },
      data: {
        ...updateData,
        companies: {
          create: newCompanyIds.map((cid) => ({ companyId: cid })),
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
    console.error('PUT user error:', error);
    const msg = error instanceof Error && error.message.includes('Unique constraint')
      ? 'Username or email already exists'
      : 'Failed to update user';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser(request);
  if (!session?.isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { id } = await params;

  // Prevent self-deletion
  if (id === session.id) {
    return NextResponse.json({ success: false, error: 'You cannot delete your own account' }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
