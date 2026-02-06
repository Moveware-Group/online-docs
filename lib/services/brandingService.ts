/**
 * Service layer for branding settings using Prisma
 */

import { prisma } from '../db';
import { BrandingSettings } from '@prisma/client';

export type BrandingContent = BrandingSettings;

class BrandingService {
  /**
   * Get branding for a specific company
   */
  async getBranding(companyId?: string): Promise<BrandingSettings | null> {
    try {
      if (!companyId) {
        // Get the first branding or from a default company
        return await prisma.brandingSettings.findFirst();
      }
      return await prisma.brandingSettings.findUnique({
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
  async createBranding(companyId: string, data: Partial<BrandingSettings>): Promise<BrandingSettings> {
    try {
      return await prisma.brandingSettings.create({
        data: {
          companyId,
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor || '#2563eb',
          secondaryColor: data.secondaryColor || '#1e40af',
          fontFamily: data.fontFamily || 'Inter',
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
  async updateBranding(companyId: string, data: Partial<BrandingSettings>): Promise<BrandingSettings> {
    try {
      return await prisma.brandingSettings.update({
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
      await prisma.brandingSettings.delete({
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
  async upsertBranding(companyId: string, data: Partial<BrandingSettings>): Promise<BrandingSettings> {
    try {
      return await prisma.brandingSettings.upsert({
        where: { companyId },
        create: {
          companyId,
          logoUrl: data.logoUrl,
          primaryColor: data.primaryColor || '#2563eb',
          secondaryColor: data.secondaryColor || '#1e40af',
          fontFamily: data.fontFamily || 'Inter',
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
