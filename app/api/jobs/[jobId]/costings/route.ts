/**
 * Job Costings API
 * GET /api/jobs/[jobId]/costings?coId=<companyId>
 *
 * Returns costing / pricing options for a given job.
 * Currently serves mock data for job 111505.
 * TODO: Replace with live Moveware API integration once available.
 */

import { NextRequest, NextResponse } from "next/server";

interface MockCostingItem {
  id: string;
  name: string;
  category: string;
  description: string;
  quantity: number;
  rate: number;
  netTotal: string;
  totalPrice: number;
  taxIncluded: boolean;
  rawData: {
    inclusions: string[];
    exclusions: string[];
  };
}

/** Mock costings for job 111505 */
const MOCK_COSTINGS: Record<string, MockCostingItem[]> = {
  "111505": [
    {
      id: "cost-111505-01",
      name: "Standard Domestic Move",
      category: "Domestic",
      description:
        "Full-service domestic move from Cranbourne to Hawthorn East. " +
        "Includes professional packing, loading, transport, unloading, " +
        "and placement at your new home.",
      quantity: 1,
      rate: 2675.0,
      netTotal: "2,431.82",
      totalPrice: 2675.0,
      taxIncluded: true,
      rawData: {
        inclusions: [
          "Professional packing of all household goods",
          "Supply of packing materials (cartons, tape, bubble wrap)",
          "Disassembly and reassembly of standard furniture",
          "Loading and unloading by experienced crew",
          "Transport from origin to destination",
          "Placement of furniture in rooms of your choice",
          "Basic transit insurance coverage",
          "Floor and doorway protection at both addresses",
        ],
        exclusions: [
          "Storage services",
          "Cleaning services at origin or destination",
          "Disconnection / reconnection of appliances",
          "Piano or specialty item moving (quoted separately)",
          "Parking permits or access fees",
          "Additional insurance above standard coverage",
        ],
      },
    },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "Job ID is required" },
        { status: 400 },
      );
    }

    const costings = MOCK_COSTINGS[jobId];

    if (!costings) {
      return NextResponse.json(
        {
          success: false,
          error: `No costings found for job ${jobId}. Only mock job 111505 is available.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: costings,
      count: costings.length,
      source: "mock",
    });
  } catch (error) {
    console.error("Error fetching costings:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch costings" },
      { status: 500 },
    );
  }
}
