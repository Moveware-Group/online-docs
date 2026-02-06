/**
 * Service layer for copy content using Prisma
 */

import { prisma } from '../db';
import { CopySettings } from '@prisma/client';

export type CopyContent = CopySettings;

class CopyService {
  /**
   * Get copy for a specific company
   */
  async getCopy(companyId?: string): Promise<CopySettings | null> {
    try {
      if (!companyId) {
        // Get the first copy or from a default company
        return await prisma.copySettings.findFirst();
      }
      return await prisma.copySettings.findUnique({
        where: { companyId },
      });
    } catch (error) {
      console.error('Error fetching copy:', error);
      return null;
    }
  }

  /**
   * Get copy by key (legacy method for backward compatibility)
   */
  async getCopyByKey(key: string): Promise<CopySettings | null> {
    try {
      // Assuming 'key' is the companyId for now
      return await prisma.copySettings.findUnique({
        where: { companyId: key },
      });
    } catch (error) {
      console.error(`Error fetching copy for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get copy by section (returns the copy object, app can filter by section field)
   */
  async getCopyBySection(section: string): Promise<CopySettings | null> {
    try {
      // Since CopySettings model doesn't have a section field directly,
      // this returns the first copy. Apps should handle section filtering.
      return await prisma.copySettings.findFirst();
    } catch (error) {
      console.error(`Error fetching copy for section ${section}:`, error);
      return null;
    }
  }

  /**
   * Create new copy
   */
  async createCopy(companyId: string, data: Partial<CopySettings>): Promise<CopySettings> {
    try {
      return await prisma.copySettings.create({
        data: {
          companyId,
          welcomeMessage: data.welcomeMessage || 'Welcome',
          introText: data.introText || '',
          footerText: data.footerText,
          submitButtonText: data.submitButtonText || 'Submit',
        },
      });
    } catch (error) {
      console.error('Error creating copy:', error);
      throw error;
    }
  }

  /**
   * Update copy
   */
  async updateCopy(companyId: string, data: Partial<CopySettings>): Promise<CopySettings> {
    try {
      return await prisma.copySettings.update({
        where: { companyId },
        data,
      });
    } catch (error) {
      console.error('Error updating copy:', error);
      throw error;
    }
  }

  /**
   * Delete copy
   */
  async deleteCopy(companyId: string): Promise<void> {
    try {
      await prisma.copySettings.delete({
        where: { companyId },
      });
    } catch (error) {
      console.error('Error deleting copy:', error);
      throw error;
    }
  }

  /**
   * Upsert copy
   */
  async upsertCopy(companyId: string, data: Partial<CopySettings>): Promise<CopySettings> {
    try {
      return await prisma.copySettings.upsert({
        where: { companyId },
        create: {
          companyId,
          welcomeMessage: data.welcomeMessage || 'Welcome',
          introText: data.introText || '',
          footerText: data.footerText,
          submitButtonText: data.submitButtonText || 'Submit',
        },
        update: data,
      });
    } catch (error) {
      console.error('Error upserting copy:', error);
      throw error;
    }
  }
}

export const copyService = new CopyService();
export default copyService;
