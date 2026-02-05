/**
 * Service layer for copy settings CRUD operations
 */

import {
  CopySettings,
  CreateCopyInput,
  UpdateCopyInput,
} from '../types/settings';
import {
  readData,
  writeData,
  findById,
  generateId,
  StorageError,
} from '../data/storage';

const STORAGE_KEY = 'copy';

export class CopyServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CopyServiceError';
  }
}

/**
 * Create a new copy settings entry
 */
export async function createCopy(
  input: CreateCopyInput
): Promise<CopySettings> {
  try {
    const settings = await readData<CopySettings>(STORAGE_KEY);
    
    const newCopy: CopySettings = {
      id: generateId(),
      ...input,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    settings.push(newCopy);
    await writeData(STORAGE_KEY, settings);
    
    return newCopy;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new CopyServiceError(`Failed to create copy: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get all copy settings
 */
export async function getAllCopy(): Promise<CopySettings[]> {
  try {
    return await readData<CopySettings>(STORAGE_KEY);
  } catch (error) {
    if (error instanceof StorageError) {
      throw new CopyServiceError(`Failed to get copy: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get copy settings by ID
 */
export async function getCopyById(id: string): Promise<CopySettings | null> {
  try {
    const settings = await readData<CopySettings>(STORAGE_KEY);
    const copy = findById(settings, id);
    return copy || null;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new CopyServiceError(`Failed to get copy by ID: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get copy settings by section
 */
export async function getCopyBySection(section: string): Promise<CopySettings[]> {
  try {
    const settings = await readData<CopySettings>(STORAGE_KEY);
    return settings.filter(item => item.section === section);
  } catch (error) {
    if (error instanceof StorageError) {
      throw new CopyServiceError(`Failed to get copy by section: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get copy settings by section and key
 */
export async function getCopyByKey(
  section: string,
  key: string,
  locale?: string
): Promise<CopySettings | null> {
  try {
    const settings = await readData<CopySettings>(STORAGE_KEY);
    const filtered = settings.filter(
      item => item.section === section && item.key === key
    );
    
    if (filtered.length === 0) return null;
    
    // If locale is specified, try to find matching locale
    if (locale) {
      const localeMatch = filtered.find(item => item.locale === locale);
      if (localeMatch) return localeMatch;
    }
    
    // Return first match or default (no locale)
    return filtered.find(item => !item.locale) || filtered[0];
  } catch (error) {
    if (error instanceof StorageError) {
      throw new CopyServiceError(`Failed to get copy by key: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Update copy settings by ID
 */
export async function updateCopy(
  id: string,
  input: UpdateCopyInput
): Promise<CopySettings | null> {
  try {
    const settings = await readData<CopySettings>(STORAGE_KEY);
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
      throw new CopyServiceError(`Failed to update copy: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Delete copy settings by ID
 */
export async function deleteCopy(id: string): Promise<boolean> {
  try {
    const settings = await readData<CopySettings>(STORAGE_KEY);
    const filtered = settings.filter(item => item.id !== id);
    
    if (filtered.length === settings.length) {
      return false; // Item not found
    }
    
    await writeData(STORAGE_KEY, filtered);
    return true;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new CopyServiceError(`Failed to delete copy: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Bulk upsert copy settings for a section
 */
export async function bulkUpsertCopy(
  section: string,
  copies: Array<{ key: string; value: string; locale?: string }>
): Promise<CopySettings[]> {
  try {
    const settings = await readData<CopySettings>(STORAGE_KEY);
    const results: CopySettings[] = [];
    
    for (const copyInput of copies) {
      const existing = settings.find(
        item =>
          item.section === section &&
          item.key === copyInput.key &&
          item.locale === copyInput.locale
      );
      
      if (existing) {
        // Update existing
        const index = settings.indexOf(existing);
        settings[index] = {
          ...existing,
          value: copyInput.value,
          updatedAt: new Date(),
        };
        results.push(settings[index]);
      } else {
        // Create new
        const newCopy: CopySettings = {
          id: generateId(),
          section,
          key: copyInput.key,
          value: copyInput.value,
          locale: copyInput.locale,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        settings.push(newCopy);
        results.push(newCopy);
      }
    }
    
    await writeData(STORAGE_KEY, settings);
    return results;
  } catch (error) {
    if (error instanceof StorageError) {
      throw new CopyServiceError(`Failed to bulk upsert copy: ${error.message}`);
    }
    throw error;
  }
}
