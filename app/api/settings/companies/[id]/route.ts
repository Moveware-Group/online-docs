import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * DELETE /api/settings/companies/[id]
 * Delete a company and its related settings (cascade handled by Prisma schema).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify company exists
    const existing = await prisma.company.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Delete related settings first (in case cascade isn't set up in DB)
    await prisma.brandingSettings.deleteMany({ where: { companyId: id } });
    await prisma.heroSettings.deleteMany({ where: { companyId: id } });
    await prisma.copySettings.deleteMany({ where: { companyId: id } });

    // Delete company
    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    );
  }
}
