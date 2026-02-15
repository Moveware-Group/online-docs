#!/usr/bin/env tsx
/**
 * Storage Verification Script
 * Run this before starting the application to verify storage is properly configured
 * Usage: npm run storage:check
 */

import {
  performStorageHealthCheck,
  ensureStorageDirectory,
  getStorageDirectory,
} from "../lib/utils/storageHealthCheck";

async function main() {
  console.log("\n🔍 Verifying storage configuration...\n");

  const storageDir = getStorageDirectory();
  console.log(`Storage directory: ${storageDir}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}\n`);

  // Attempt to create directory if it doesn't exist (development only)
  if (process.env.NODE_ENV === "development") {
    try {
      await ensureStorageDirectory();
    } catch (error) {
      console.error("⚠️  Warning: Could not create storage directory");
      console.error(
        `   ${error instanceof Error ? error.message : String(error)}\n`,
      );
    }
  }

  // Perform health check
  const result = await performStorageHealthCheck();

  console.log("Health Check Results:");
  console.log(`  Directory exists: ${result.checks.exists ? "✓" : "✗"}`);
  console.log(`  Directory readable: ${result.checks.readable ? "✓" : "✗"}`);
  console.log(`  Directory writable: ${result.checks.writable ? "✓" : "✗"}`);
  console.log("");

  if (result.success) {
    console.log("✅ Storage verification passed\n");
    process.exit(0);
  } else {
    console.error("❌ Storage verification failed");
    console.error(`   ${result.error}\n`);

    // Provide helpful instructions
    console.log("To fix this issue:");
    console.log("  1. Create the directory: sudo mkdir -p " + storageDir);
    console.log("  2. Set appropriate permissions:");
    console.log(
      "     - For www-data: sudo chown -R www-data:www-data " + storageDir,
    );
    console.log("     - For node user: sudo chown -R node:node " + storageDir);
    console.log(
      "     - For current user: sudo chown -R $USER:$USER " + storageDir,
    );
    console.log(
      "  3. Ensure write permissions: sudo chmod -R 755 " + storageDir,
    );
    console.log("\nFor production environments, see STORAGE_SETUP.md\n");

    process.exit(1);
  }
}

main().catch((error) => {
  console.error("\n❌ Fatal error during storage verification:");
  console.error(error);
  process.exit(1);
});
