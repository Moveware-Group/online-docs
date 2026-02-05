import { NextRequest, NextResponse } from 'next/server';
import { jobService } from '@/lib/services/jobService';
import { inventoryService } from '@/lib/services/inventoryService';
import { movewareClient } from '@/lib/clients/moveware';
import { transformJobForDatabase, transformInventoryItemForDatabase } from '@/lib/types/job';

/**
 * Force sync job and inventory data from Moveware API
 * This endpoint will always fetch fresh data from Moveware and update the database
 */
export async function POST(
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
    const results = {
      job: false,
      inventory: false,
      inventoryCount: 0,
      errors: [] as string[],
    };

    // 1. Fetch and sync job data
    try {
      console.log(`Syncing job ${jobId} from Moveware API...`);
      const movewareJob = await movewareClient.get(`/jobs/${jobId}`);
      
      if (movewareJob) {
        const jobData = transformJobForDatabase(movewareJob);
        await jobService.upsertJob(jobData);
        results.job = true;
        console.log(`✓ Job ${jobId} synced successfully`);
      }
    } catch (jobError) {
      console.error(`Error syncing job:`, jobError);
      results.errors.push('Failed to sync job data');
    }

    // 2. Fetch and sync inventory data
    try {
      console.log(`Syncing inventory for job ${jobId} from Moveware API...`);
      const movewareInventory = await movewareClient.get(`/jobs/${jobId}/inventory`);
      
      if (movewareInventory && movewareInventory.inventoryUsage) {
        // Delete existing inventory for this job
        await inventoryService.deleteInventoryByJob(jobIdInt);
        
        // Transform and save all inventory items
        const inventoryItems = movewareInventory.inventoryUsage.map((item: any) => 
          transformInventoryItemForDatabase(item, jobIdInt)
        );

        await inventoryService.upsertInventoryItems(inventoryItems);
        results.inventory = true;
        results.inventoryCount = inventoryItems.length;
        console.log(`✓ Synced ${inventoryItems.length} inventory items`);
      }
    } catch (inventoryError) {
      console.error(`Error syncing inventory:`, inventoryError);
      results.errors.push('Failed to sync inventory data');
    }

    // Return results
    if (!results.job && !results.inventory) {
      return NextResponse.json(
        { 
          error: 'Failed to sync data from Moveware API',
          details: results.errors
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Data synced successfully',
        synced: results
      },
      { status: 200 }
    );
  } catch (error) {
    const awaitedParams = await params;
    console.error(`Error syncing job ${awaitedParams.jobId}:`, error);

    return NextResponse.json(
      { error: 'Failed to sync job data' },
      { status: 500 }
    );
  }
}
