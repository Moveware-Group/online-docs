/**
 * Service layer for hero settings using Prisma
 */

import { prisma } from '../db';
import { Hero } from '@prisma/client';

export type HeroContent = Hero;

class HeroService {
  /**
   * Get hero for a specific company
   */
  async getHero(companyId?: string): Promise<Hero | null> {
    try {
      if (!companyId) {
        // Get the first hero or from a default company
        return await prisma.hero.findFirst();
      }
      return await prisma.hero.findUnique({
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
  async createHero(companyId: string, data: Partial<Hero>): Promise<Hero> {
    try {
      return await prisma.hero.create({
        data: {
          companyId,
          ...data,
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
  async updateHero(companyId: string, data: Partial<Hero>): Promise<Hero> {
    try {
      return await prisma.hero.update({
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
      await prisma.hero.delete({
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
  async upsertHero(companyId: string, data: Partial<Hero>): Promise<Hero> {
    try {
      return await prisma.hero.upsert({
        where: { companyId },
        create: {
          companyId,
          ...data,
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
