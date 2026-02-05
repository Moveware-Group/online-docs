/**
 * Service layer for branding settings CRUD operations
 */

import {
  BrandingSettings,
  CreateBrandingInput,
  UpdateBrandingInput,
} from '../types/settings';
import {
  readData,
  writeData,
  findById,
  generateId,
  StorageError,
} from '../data/storage';

const STORAGE_KEY = 'branding';

export class BrandingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BrandingServiceError';
  }
}

/**
 * Create a new branding settings entry
 */
export async function createBranding(
  input: CreateBrandingInput
): Promise<BrandingSettings> {
  try {
    const settings = await readData<BrandingSettings>(STORAGE_KEY);
    
    const newBranding: BrandingSettings = {
      id: generateId(),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    settings.push(newBranding);
    await writeData(STORAGE_KEY, settings);
    
    return newBranding;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new BrandingServiceError(`Failed to create branding: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get all branding settings
 */
export async function getAllBranding(): Promise<BrandingSettings[]> {
  try {
    return await readData<BrandingSettings>(STORAGE_KEY);
  } catch (error) {
    if (error instanceof StorageError) {
      throw new BrandingServiceError(`Failed to get branding: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get branding settings by ID
 */
export async function getBrandingById(id: string): Promise<BrandingSettings | null> {
  try {
    const settings = await readData<BrandingSettings>(STORAGE_KEY);
    const branding = findById(settings, id);
    return branding || null;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new BrandingServiceError(`Failed to get branding by ID: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get the active/latest branding settings
 */
export async function getActiveBranding(): Promise<BrandingSettings | null> {
  try {
    const settings = await readData<BrandingSettings>(STORAGE_KEY);
    if (settings.length === 0) return null;
    
    // Return the most recently updated one
    return settings.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
  } catch (error) {
    if (error instanceof StorageError) {
      throw new BrandingServiceError(`Failed to get active branding: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update branding settings by ID
 */
export async function updateBranding(
  id: string,
  input: UpdateBrandingInput
): Promise<BrandingSettings | null> {
  try {
    const settings = await readData<BrandingSettings>(STORAGE_KEY);
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
      throw new BrandingServiceError(`Failed to update branding: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Delete branding settings by ID
 */
export async function deleteBranding(id: string): Promise<boolean> {
  try {
    const settings = await readData<BrandingSettings>(STORAGE_KEY);
    const filtered = settings.filter(item => item.id !== id);
    
    if (filtered.length === settings.length) {
      return false; // Item not found
    }
    
    await writeData(STORAGE_KEY, filtered);
    return true;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new BrandingServiceError(`Failed to delete branding: ${error.message}`);
    }
    throw error;
  }
}
