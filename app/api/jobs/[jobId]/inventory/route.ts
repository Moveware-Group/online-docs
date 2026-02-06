import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventoryService';
import { createMovewareClient } from '@/lib/clients/moveware';
import { transformInventoryItemForDatabase } from '@/lib/types/job';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Extract company ID from URL parameter
    const { searchParams } = new URL(request.url);
    const coIdParam = searchParams.get('coId');

    // Validate jobId parameter
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Validate and parse company ID as integer
    if (!coIdParam) {
      return NextResponse.json(
        { error: 'Company ID (coId) parameter is required' },
        { status: 400 }
      );
    }

    const companyId = parseInt(coIdParam);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: 'Company ID (coId) must be a valid integer' },
        { status: 400 }
      );
    }

    // Try to fetch inventory from database first
    let inventory = await inventoryService.getInventoryByJob(jobId);

    // If no inventory in database, fetch from Moveware API and save
    if (!inventory || inventory.length === 0) {
      console.log(`Inventory for job ${jobId} not found in database. Fetching from Moveware API (Company ID: ${companyId})...`);
      
      try {
        // Create client with dynamic company ID (integer)
        const movewareClient = createMovewareClient(companyId);
        
        // Fetch from Moveware API - returns data directly
        const movewareInventory = await movewareClient.get<any>(`/jobs/${jobId}/inventory`);
        
        if (!movewareInventory || !movewareInventory.inventoryUsage) {
          console.log(`No inventory found in Moveware API for job ${jobId}`);
          return NextResponse.json(
            {
              success: true,
              data: []
            },
            { status: 200 }
          );
        }

        // Transform and save all inventory items
        const inventoryItems = movewareInventory.inventoryUsage.map((item: any) => 
          transformInventoryItemForDatabase(item, jobId)
        );

        // Bulk upsert inventory items
        await inventoryService.upsertInventoryItems(inventoryItems);
        
        // Fetch the saved inventory
        inventory = await inventoryService.getInventoryByJob(jobId);
        
        console.log(`✓ Saved ${inventoryItems.length} inventory items for job ${jobId}`);
      } catch (apiError) {
        console.error(`Error fetching inventory from Moveware API:`, apiError);
        // Return empty array if API fails but don't fail the whole request
        return NextResponse.json(
          {
            success: true,
            data: []
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: inventory
      },
      { status: 200 }
    );
  } catch (error) {
    const awaitedParams = await params;
    console.error(`Error fetching inventory for job ${awaitedParams.jobId}:`, error);

    return NextResponse.json(
      { error: 'Failed to fetch job inventory' },
      { status: 500 }
    );
  }
}
