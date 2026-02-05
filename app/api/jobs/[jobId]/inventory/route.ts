import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventoryService';
import { movewareClient } from '@/lib/clients/moveware';
import { transformInventoryItemForDatabase } from '@/lib/types/job';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;

    // Validate jobId parameter
    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    const jobIdInt = parseInt(jobId);

    // Try to fetch inventory from database first
    let inventory = await inventoryService.getInventoryByJob(jobIdInt);

    // If no inventory in database, fetch from Moveware API and save
    if (!inventory || inventory.length === 0) {
      console.log(`Inventory for job ${jobId} not found in database. Fetching from Moveware API...`);
      
      try {
        // Fetch from Moveware API
        const movewareInventory = await movewareClient.get(`/jobs/${jobId}/inventory`);
        
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
          transformInventoryItemForDatabase(item, jobIdInt)
        );

        // Bulk upsert inventory items
        await inventoryService.upsertInventoryItems(inventoryItems);
        
        // Fetch the saved inventory
        inventory = await inventoryService.getInventoryByJob(jobIdInt);
        
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
