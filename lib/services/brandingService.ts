/**
 * Service layer for branding settings using Prisma
 */

import { prisma } from '../db';
import { Branding } from '@prisma/client';

export type BrandingContent = Branding;

class BrandingService {
  /**
   * Get branding for a specific company
   */
  async getBranding(companyId?: string): Promise<Branding | null> {
    try {
      if (!companyId) {
        // Get the first branding or from a default company
        return await prisma.branding.findFirst();
      }
      return await prisma.branding.findUnique({
        where: { companyId },
      });
    } catch (error) {
      console.error('Error fetching branding:', error);
      return null;
    }
  }

  /**
   * Create new branding
   */
  async createBranding(companyId: string, data: Partial<Branding>): Promise<Branding> {
    try {
      return await prisma.branding.create({
        data: {
          companyId,
          ...data,
        },
      });
    } catch (error) {
      console.error('Error creating branding:', error);
      throw error;
    }
  }

  /**
   * Update branding
   */
  async updateBranding(companyId: string, data: Partial<Branding>): Promise<Branding> {
    try {
      return await prisma.branding.update({
        where: { companyId },
        data,
      });
    } catch (error) {
      console.error('Error updating branding:', error);
      throw error;
    }
  }

  /**
   * Delete branding
   */
  async deleteBranding(companyId: string): Promise<void> {
    try {
      await prisma.branding.delete({
        where: { companyId },
      });
    } catch (error) {
      console.error('Error deleting branding:', error);
      throw error;
    }
  }

  /**
   * Upsert branding
   */
  async upsertBranding(companyId: string, data: Partial<Branding>): Promise<Branding> {
    try {
      return await prisma.branding.upsert({
        where: { companyId },
        create: {
          companyId,
          ...data,
        },
        update: data,
      });
    } catch (error) {
      console.error('Error upserting branding:', error);
      throw error;
    }
  }
}

export const brandingService = new BrandingService();
export default brandingService;
