/**
 * Job Details API
 * GET /api/jobs/[jobId]?coId=<companyId>
 *
 * Returns job details including customer info, addresses, measures, and branding.
 * Currently serves mock data for job 111505 (Leigh Morrow - Crown Worldwide).
 * TODO: Replace with live Moveware API integration once available.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Mock job record for demonstration / development */
const MOCK_JOBS: Record<
  string,
  {
    id: number;
    titleName: string;
    firstName: string;
    lastName: string;
    moveManager: string;
    moveType: string;
    estimatedDeliveryDetails: string;
    jobValue: number;
    brandCode: string;
    branchCode: string;
    upliftLine1: string;
    upliftLine2: string;
    upliftCity: string;
    upliftState: string;
    upliftPostcode: string;
    upliftCountry: string;
    deliveryLine1: string;
    deliveryLine2: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryPostcode: string;
    deliveryCountry: string;
    measuresVolumeGrossM3: number;
    measuresWeightGrossKg: number;
  }
> = {
  "111505": {
    id: 111505,
    titleName: "Mr",
    firstName: "Leigh",
    lastName: "Morrow",
    moveManager: "Sarah Johnson",
    moveType: "LR",
    estimatedDeliveryDetails: "27/02/2026",
    jobValue: 2675.0,
    brandCode: "MWB",
    branchCode: "MEL",
    upliftLine1: "3 Spring Water Crescent",
    upliftLine2: "",
    upliftCity: "Cranbourne",
    upliftState: "VIC",
    upliftPostcode: "3977",
    upliftCountry: "Australia",
    deliveryLine1: "12 Cato Street",
    deliveryLine2: "",
    deliveryCity: "Hawthorn East",
    deliveryState: "VIC",
    deliveryPostcode: "3123",
    deliveryCountry: "Australia",
    measuresVolumeGrossM3: 0.622965,
    measuresWeightGrossKg: 70,
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const { searchParams } = new URL(request.url);
    const coId = searchParams.get("coId");

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 },
      );
    }

    // Look up mock data
    const mockJob = MOCK_JOBS[jobId];

    if (!mockJob) {
      return NextResponse.json(
        {
          success: false,
          error: `Job ${jobId} not found. Only mock job 111505 is available.`,
        },
        { status: 404 },
      );
    }

    // Try to fetch branding from the database
    let branding = {
      companyName: "Moveware",
      logoUrl: "",
      heroBannerUrl: "",
      footerImageUrl: "",
      primaryColor: "#1E40AF",
      secondaryColor: "#FFFFFF",
      fontFamily: "Inter",
    };

    try {
      // Look up company by coId (tenantId) first, then fall back to brandCode match
      let company = null;
      if (coId) {
        company = await prisma.company.findFirst({
          where: { tenantId: coId },
          include: { brandingSettings: true },
        });
      }
      if (!company) {
        company = await prisma.company.findFirst({
          where: {
            OR: [
              { brandCode: mockJob.brandCode },
              { isActive: true },
            ],
          },
          include: { brandingSettings: true },
          orderBy: { createdAt: "asc" },
        });
      }

      if (company) {
        branding = {
          companyName: company.name,
          logoUrl:
            company.brandingSettings?.logoUrl ||
            company.logoUrl ||
            branding.logoUrl,
          heroBannerUrl:
            company.brandingSettings?.heroBannerUrl ||
            branding.heroBannerUrl,
          footerImageUrl:
            company.brandingSettings?.footerImageUrl ||
            branding.footerImageUrl,
          primaryColor:
            company.brandingSettings?.primaryColor ||
            company.primaryColor ||
            branding.primaryColor,
          secondaryColor:
            company.brandingSettings?.secondaryColor ||
            company.secondaryColor ||
            branding.secondaryColor,
          fontFamily:
            company.brandingSettings?.fontFamily ||
            branding.fontFamily,
        };
      }
    } catch (dbError) {
      // If DB lookup fails, continue with default branding
      console.warn("Could not fetch branding from database:", dbError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...mockJob,
        branding,
      },
      source: "mock",
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job details" },
      { status: 500 },
    );
  }
}
