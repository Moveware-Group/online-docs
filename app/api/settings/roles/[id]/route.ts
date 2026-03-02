/**
 * PUT    /api/settings/roles/[id]  — update a role (admin only)
 * DELETE /api/settings/roles/[id]  — delete a role (admin only, non-system only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionUser } from '@/lib/auth/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser(request);
  if (!session?.isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    const { name, description, permissions } = await request.json();
    if (!name?.trim()) return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).role.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });

    // Prevent renaming system roles
    const updateData: Record<string, unknown> = {
      description: description?.trim() ?? null,
      permissions: JSON.stringify(Array.isArray(permissions) ? permissions : []),
    };
    if (!existing.isSystem) updateData.name = name.trim();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await (prisma as any).role.update({ where: { id }, data: updateData });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        description: updated.description ?? '',
        permissions: JSON.parse(updated.permissions) as string[],
        isSystem: updated.isSystem,
      },
    });
  } catch (error) {
    console.error('PUT role error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update role' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser(request);
  if (!session?.isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (prisma as any).role.findUnique({
      where: { id },
      include: { _count: { select: { users: true } } },
    });
    if (!existing) return NextResponse.json({ success: false, error: 'Role not found' }, { status: 404 });
    if (existing.isSystem) return NextResponse.json({ success: false, error: 'Cannot delete system roles' }, { status: 400 });
    if (existing._count.users > 0) return NextResponse.json({ success: false, error: `Cannot delete role — ${existing._count.users} user(s) are assigned to it` }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).role.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE role error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete role' }, { status: 500 });
  }
}
