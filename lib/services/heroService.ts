/**
 * Service layer for hero settings CRUD operations
 */

import {
  HeroSettings,
  CreateHeroInput,
  UpdateHeroInput,
} from '../types/settings';
import {
  readData,
  writeData,
  findById,
  generateId,
  StorageError,
} from '../data/storage';

const STORAGE_KEY = 'hero';

export class HeroServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HeroServiceError';
  }
}

/**
 * Create a new hero settings entry
 */
export async function createHero(
  input: CreateHeroInput
): Promise<HeroSettings> {
  try {
    const settings = await readData<HeroSettings>(STORAGE_KEY);
    
    const newHero: HeroSettings = {
      id: generateId(),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    settings.push(newHero);
    await writeData(STORAGE_KEY, settings);
    
    return newHero;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new HeroServiceError(`Failed to create hero: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get all hero settings
 */
export async function getAllHero(): Promise<HeroSettings[]> {
  try {
    return await readData<HeroSettings>(STORAGE_KEY);
  } catch (error) {
    if (error instanceof StorageError) {
      throw new HeroServiceError(`Failed to get hero: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get hero settings by ID
 */
export async function getHeroById(id: string): Promise<HeroSettings | null> {
  try {
    const settings = await readData<HeroSettings>(STORAGE_KEY);
    const hero = findById(settings, id);
    return hero || null;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new HeroServiceError(`Failed to get hero by ID: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get the active/latest hero settings
 */
export async function getActiveHero(): Promise<HeroSettings | null> {
  try {
    const settings = await readData<HeroSettings>(STORAGE_KEY);
    if (settings.length === 0) return null;
    
    // Return the most recently updated one
    return settings.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  } catch (error) {
    if (error instanceof StorageError) {
      throw new HeroServiceError(`Failed to get active hero: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update hero settings by ID
 */
export async function updateHero(
  id: string,
  input: UpdateHeroInput
): Promise<HeroSettings | null> {
  try {
    const settings = await readData<HeroSettings>(STORAGE_KEY);
    const index = settings.findIndex(item => item.id === id);
    
    if (index === -1) {
      return null;
    }
    
    settings[index] = {
      ...settings[index],
      ...input,
      updatedAt: new Date(),
    };
    
    await writeData(STORAGE_KEY, settings);
    return settings[index];
  } catch (error) {
    if (error instanceof StorageError) {
      throw new HeroServiceError(`Failed to update hero: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Delete hero settings by ID
 */
export async function deleteHero(id: string): Promise<boolean> {
  try {
    const settings = await readData<HeroSettings>(STORAGE_KEY);
    const filtered = settings.filter(item => item.id !== id);
    
    if (filtered.length === settings.length) {
      return false; // Item not found
    }
    
    await writeData(STORAGE_KEY, filtered);
    return true;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new HeroServiceError(`Failed to delete hero: ${error.message}`);
    }
    throw error;
  }
}
