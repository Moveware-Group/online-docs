/**
 * Service layer for Inventory operations using Prisma
 */

import { prisma } from '../db';
import type { Inventory as InventoryItem } from '@prisma/client';
import type { InventoryItemData } from '../types/job';

class InventoryService {
  /**
   * Get all inventory items for a job
   */
  async getInventoryByJob(jobId: string): Promise<InventoryItem[]> {
    try {
      return await prisma.inventory.findMany({
        where: { jobId },
        orderBy: { itemName: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
  }

  /**
   * Get a specific inventory item
   */
  async getInventoryItem(id: string): Promise<InventoryItem | null> {
    try {
      return await prisma.inventory.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      return null;
    }
  }

  /**
   * Create or update an inventory item
   */
  async upsertInventoryItem(itemData: InventoryItemData): Promise<InventoryItem> {
    try {
      return await prisma.inventory.upsert({
        where: { id: itemData.id },
        create: itemData,
        update: itemData,
      });
    } catch (error) {
      console.error('Error upserting inventory item:', error);
      throw error;
    }
  }

  /**
   * Bulk upsert inventory items for a job
   */
  async upsertInventoryItems(items: InventoryItemData[]): Promise<number> {
    try {
      let count = 0;
      for (const item of items) {
        await this.upsertInventoryItem(item);
        count++;
      }
      return count;
    } catch (error) {
      console.error('Error bulk upserting inventory items:', error);
      throw error;
    }
  }

  /**
   * Delete an inventory item
   */
  async deleteInventoryItem(id: string): Promise<void> {
    try {
      await prisma.inventory.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  /**
   * Delete all inventory items for a job
   */
  async deleteInventoryByJob(jobId: string): Promise<number> {
    try {
      const result = await prisma.inventory.deleteMany({
        where: { jobId },
      });
      return result.count;
    } catch (error) {
      console.error('Error deleting inventory by job:', error);
      throw error;
    }
  }

  /**
   * Get inventory summary for a job
   */
  async getInventorySummary(jobId: string): Promise<{
    totalItems: number;
    totalQuantity: number;
    totalVolume: number;
  }> {
    try {
      const items = await this.getInventoryByJob(jobId);
      
      return {
        totalItems: items.length,
        totalQuantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        totalVolume: items.reduce((sum, item) => sum + (item.volume || 0), 0),
      };
    } catch (error) {
      console.error('Error calculating inventory summary:', error);
      return { totalItems: 0, totalQuantity: 0, totalVolume: 0 };
    }
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
