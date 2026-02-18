/**
 * Job Inventory API
 * GET /api/jobs/[jobId]/inventory?coId=<companyTenantId>
 *
 * When Moveware API credentials are configured, proxies:
 *   GET https://rest.moveware-test.app/{coId}/api/jobs/{jobId}/inventory
 * and maps the response to the internal inventory shape.
 *
 * Falls back to mock data when credentials are absent or the upstream call fails.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getMwCredentials,
  fetchMwInventory,
  adaptMwInventory,
} from '@/lib/services/moveware-api';

interface MockInventoryItem {
  id: number;
  description: string;
  room: string;
  quantity: number;
  cube: number;
  typeCode: string;
}

const MOCK_INVENTORY: Record<string, MockInventoryItem[]> = {
  '111505': [
    { id: 22301, description: 'Bed, King',           room: 'Master Bedroom', quantity: 1, cube: 2.14, typeCode: 'FUR'  },
    { id: 22302, description: 'Bed, Single',          room: 'Bedroom 2',      quantity: 1, cube: 0.71, typeCode: 'FUR'  },
    { id: 22303, description: 'Bedside Table',        room: 'Master Bedroom', quantity: 2, cube: 0.14, typeCode: 'FUR'  },
    { id: 22304, description: 'Bench',                room: 'Outdoor',        quantity: 1, cube: 0.85, typeCode: 'FUR'  },
    { id: 22305, description: 'Bookcase, Large',      room: 'Study',          quantity: 1, cube: 1.14, typeCode: 'FUR'  },
    { id: 22306, description: 'Cabinet',              room: 'Living Room',    quantity: 1, cube: 1.0,  typeCode: 'FUR'  },
    { id: 22307, description: 'Carton Bike',          room: 'Garage',         quantity: 1, cube: 0.3,  typeCode: 'CTN'  },
    { id: 22308, description: 'Chair, Dining',        room: 'Dining Room',    quantity: 4, cube: 0.14, typeCode: 'FUR'  },
    { id: 22309, description: 'Chair, Kitchen',       room: 'Kitchen',        quantity: 2, cube: 0.14, typeCode: 'FUR'  },
    { id: 22310, description: 'Chest of Drawers',     room: 'Master Bedroom', quantity: 1, cube: 0.71, typeCode: 'FUR'  },
    { id: 22311, description: 'Childs Bike',          room: 'Garage',         quantity: 1, cube: 0.2,  typeCode: 'MISC' },
    { id: 22312, description: 'Childs Furniture',     room: 'Bedroom 2',      quantity: 1, cube: 0.15, typeCode: 'FUR'  },
    { id: 22313, description: 'Clothes Horse',        room: 'Laundry',        quantity: 1, cube: 0.12, typeCode: 'MISC' },
    { id: 22314, description: 'Cubby House Kids',     room: 'Outdoor',        quantity: 1, cube: 1.0,  typeCode: 'MISC' },
    { id: 22315, description: 'Desk Large',           room: 'Study',          quantity: 1, cube: 1.0,  typeCode: 'FUR'  },
    { id: 22316, description: 'Dryer',                room: 'Laundry',        quantity: 1, cube: 0.26, typeCode: 'APPL' },
    { id: 22317, description: 'Dresser',              room: 'Master Bedroom', quantity: 1, cube: 0.85, typeCode: 'FUR'  },
    { id: 22318, description: 'Dressing Table',       room: 'Master Bedroom', quantity: 1, cube: 0.7,  typeCode: 'FUR'  },
    { id: 22319, description: 'Fishing Rods',         room: 'Garage',         quantity: 3, cube: 0.02, typeCode: 'MISC' },
    { id: 22320, description: 'Filing Cabinet 2',     room: 'Study',          quantity: 1, cube: 0.28, typeCode: 'FUR'  },
  ],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  try {
    const { jobId } = await params;
    const coId = new URL(request.url).searchParams.get('coId');

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 },
      );
    }

    // ── Live Moveware API path ─────────────────────────────────────────────
    if (coId) {
      const creds = await getMwCredentials(coId);
      if (creds) {
        try {
          const raw = await fetchMwInventory(creds, jobId);
          const items = adaptMwInventory(raw);
          return NextResponse.json({
            success: true,
            data: items,
            count: items.length,
            source: 'moveware',
          });
        } catch (err) {
          console.error(
            '[inventory/route] Moveware API failed, falling back to mock:',
            err,
          );
        }
      }
    }

    // ── Mock fallback ──────────────────────────────────────────────────────
    const items = MOCK_INVENTORY[jobId];
    if (!items) {
      return NextResponse.json(
        {
          success: false,
          error: `No inventory found for job ${jobId}. Only mock job 111505 is available when no API credentials are configured.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
      source: 'mock',
    });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory' },
      { status: 500 },
    );
  }
}
