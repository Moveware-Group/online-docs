// Server-side only storage utilities
// This file should only be imported in server components or API routes
// DO NOT import this in client components

import fs from 'fs/promises';
import path from 'path';

// Ensure this runs only on server
if (typeof window !== 'undefined') {
  throw new Error('storage.ts should only be imported in server-side code');
}

const DATA_DIR = path.join(process.cwd(), 'data');

/**
 * Initialize data directory
 */
export async function initDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create data directory:', error);
    throw error;
  }
}

/**
 * Read data from a JSON file
 */
export async function readData<T>(filename: string): Promise<T | null> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    console.error(`Failed to read ${filename}:`, error);
    throw error;
  }
}

/**
 * Write data to a JSON file
 */
export async function writeData<T>(filename: string, data: T): Promise<void> {
  try {
    await initDataDir();
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Failed to write ${filename}:`, error);
    throw error;
  }
}

/**
 * Delete a data file
 */
export async function deleteData(filename: string): Promise<void> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Failed to delete ${filename}:`, error);
      throw error;
    }
  }
}

/**
 * Check if a data file exists
 */
export async function dataExists(filename: string): Promise<boolean> {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
