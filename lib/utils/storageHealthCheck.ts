/**
 * Storage Health Check Utility
 * Verifies that the local file storage directory is accessible and writable
 */

import { promises as fs } from "fs";
import path from "path";

export interface StorageHealthCheckResult {
  success: boolean;
  directory: string;
  checks: {
    exists: boolean;
    writable: boolean;
    readable: boolean;
  };
  error?: string;
}

/**
 * Get the storage directory path from environment or use default
 */
export function getStorageDirectory(): string {
  return process.env.LOCAL_STORAGE_PATH || "/srv/uploads/logos";
}

/**
 * Check if a directory exists
 */
async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory is writable by attempting to create and delete a test file
 */
async function isDirectoryWritable(dirPath: string): Promise<boolean> {
  const testFile = path.join(dirPath, `.write-test-${Date.now()}`);
  try {
    await fs.writeFile(testFile, "test", "utf8");
    await fs.unlink(testFile);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a directory is readable by attempting to read its contents
 */
async function isDirectoryReadable(dirPath: string): Promise<boolean> {
  try {
    await fs.readdir(dirPath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Perform comprehensive health check on storage directory
 */
export async function performStorageHealthCheck(): Promise<StorageHealthCheckResult> {
  const storageDir = getStorageDirectory();

  const result: StorageHealthCheckResult = {
    success: false,
    directory: storageDir,
    checks: {
      exists: false,
      writable: false,
      readable: false,
    },
  };

  try {
    // Check if directory exists
    result.checks.exists = await directoryExists(storageDir);

    if (!result.checks.exists) {
      result.error = `Storage directory does not exist: ${storageDir}`;
      return result;
    }

    // Check if directory is readable
    result.checks.readable = await isDirectoryReadable(storageDir);

    if (!result.checks.readable) {
      result.error = `Storage directory is not readable: ${storageDir}`;
      return result;
    }

    // Check if directory is writable
    result.checks.writable = await isDirectoryWritable(storageDir);

    if (!result.checks.writable) {
      result.error = `Storage directory is not writable: ${storageDir}`;
      return result;
    }

    // All checks passed
    result.success = true;
    return result;
  } catch (error) {
    result.error = `Unexpected error during storage health check: ${error instanceof Error ? error.message : String(error)}`;
    return result;
  }
}

/**
 * Create storage directory if it doesn't exist (requires appropriate permissions)
 */
export async function ensureStorageDirectory(): Promise<void> {
  const storageDir = getStorageDirectory();

  try {
    const exists = await directoryExists(storageDir);

    if (!exists) {
      await fs.mkdir(storageDir, { recursive: true, mode: 0o755 });
      console.log(`✓ Created storage directory: ${storageDir}`);
    }
  } catch (error) {
    throw new Error(
      `Failed to create storage directory ${storageDir}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
