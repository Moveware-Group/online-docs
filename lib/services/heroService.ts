/**
 * Service layer for hero settings using Prisma
 */

import { prisma } from '../db';
import { HeroSettings } from '@prisma/client';

export type HeroContent = HeroSettings;

class HeroService {
  /**
   * Get hero for a specific company
   */
  async getHero(companyId?: string): Promise<HeroSettings | null> {
    try {
      if (!companyId) {
        // Get the first hero or from a default company
        return await prisma.heroSettings.findFirst();
      }
      return await prisma.heroSettings.findUnique({
        where: { companyId },
      });
    } catch (error) {
      console.error('Error fetching hero:', error);
      return null;
    }
  }

  /**
   * Create a new hero
   */
  async createHero(companyId: string, data: Partial<HeroSettings>): Promise<HeroSettings> {
    try {
      return await prisma.heroSettings.create({
        data: {
          companyId,
          title: data.title || 'Welcome',
          subtitle: data.subtitle,
          backgroundImage: data.backgroundImage,
          backgroundColor: data.backgroundColor || '#2563eb',
          textColor: data.textColor || '#ffffff',
          showLogo: data.showLogo ?? true,
          alignment: data.alignment || 'left',
        },
      });
    } catch (error) {
      console.error('Error creating hero:', error);
      throw error;
    }
  }

  /**
   * Update hero
   */
  async updateHero(companyId: string, data: Partial<HeroSettings>): Promise<HeroSettings> {
    try {
      return await prisma.heroSettings.update({
        where: { companyId },
        data,
      });
    } catch (error) {
      console.error('Error updating hero:', error);
      throw error;
    }
  }

  /**
   * Delete hero
   */
  async deleteHero(companyId: string): Promise<void> {
    try {
      await prisma.heroSettings.delete({
        where: { companyId },
      });
    } catch (error) {
      console.error('Error deleting hero:', error);
      throw error;
    }
  }

  /**
   * Upsert hero
   */
  async upsertHero(companyId: string, data: Partial<HeroSettings>): Promise<HeroSettings> {
    try {
      return await prisma.heroSettings.upsert({
        where: { companyId },
        create: {
          companyId,
          title: data.title || 'Welcome',
          subtitle: data.subtitle,
          backgroundImage: data.backgroundImage,
          backgroundColor: data.backgroundColor || '#2563eb',
          textColor: data.textColor || '#ffffff',
          showLogo: data.showLogo ?? true,
          alignment: data.alignment || 'left',
        },
        update: data,
      });
    } catch (error) {
      console.error('Error upserting hero:', error);
      throw error;
    }
  }
}

export const heroService = new HeroService();
export default heroService;
