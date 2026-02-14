import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/companies - List all companies
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      companies,
    });
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 },
    );
  }
}
