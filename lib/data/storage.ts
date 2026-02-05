/**
 * Simple file-based storage abstraction
 * Can be replaced with database implementation later
 */

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

/**
 * Ensure data directory exists
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Read data from storage
 */
export async function readData<T>(filename: string): Promise<T[]> {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  } catch (error) {
    throw new StorageError(`Failed to read data from ${filename}: ${error}`);
  }
}

/**
 * Write data to storage
 */
export async function writeData<T>(filename: string, data: T[]): Promise<void> {
  try {
    await ensureDataDir();
    const filePath = path.join(DATA_DIR, `${filename}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    throw new StorageError(`Failed to write data to ${filename}: ${error}`);
  }
}

/**
 * Find item by ID
 */
export function findById<T extends { id: string }>(items: T[], id: string): T | undefined {
  return items.find(item => item.id === id);
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
