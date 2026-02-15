/**
 * Database Reference Checker
 *
 * Utilities for checking foreign key references to prevent orphaned data
 * and provide meaningful error messages when attempting to delete referenced records.
 */

import { prisma } from "../db";

/**
 * Interface for reference count results
 */
export interface CompanyReferenceCounts {
  jobs: number;
  quotes: number;
  costings: number;
  activities: number;
  inventory: number;
  heroSettings: number;
  brandingSettings: number;
  copySettings: number;
  botConversations: number;
  reviewSubmissions: number;
}

/**
 * Check all foreign key references to a company
 *
 * This function queries all tables that have a companyId foreign key
 * and returns the count of records referencing the specified company.
 * Use this before attempting to delete a company to prevent orphaned records
 * and to generate meaningful error messages.
 *
 * @param companyId - The company ID to check references for
 * @returns Object containing reference counts for each table
 * @throws Error if database query fails
 *
 * @example
 * ```typescript
 * const refs = await checkCompanyReferences('company-123')
 * console.log(refs.jobs) // 5
 * console.log(refs.quotes) // 12
 *
 * const totalRefs = Object.values(refs).reduce((sum, count) => sum + count, 0)
 * if (totalRefs > 0) {
 *   throw new Error('Cannot delete company with existing references')
 * }
 * ```
 */
export async function checkCompanyReferences(
  companyId: string,
): Promise<CompanyReferenceCounts> {
  try {
    // Query all tables in parallel for better performance
    const [
      jobsCount,
      quotesCount,
      costingsCount,
      activitiesCount,
      inventoryCount,
      heroSettingsCount,
      brandingSettingsCount,
      copySettingsCount,
      botConversationsCount,
      reviewSubmissionsCount,
    ] = await Promise.all([
      prisma.job.count({ where: { companyId } }),
      prisma.quote.count({ where: { companyId } }),
      prisma.costing.count({ where: { companyId } }),
      prisma.activity.count({ where: { companyId } }),
      prisma.inventory.count({ where: { companyId } }),
      prisma.heroSettings.count({ where: { companyId } }),
      prisma.brandingSettings.count({ where: { companyId } }),
      prisma.copySettings.count({ where: { companyId } }),
      prisma.botConversation.count({ where: { companyId } }),
      prisma.reviewSubmission.count({ where: { companyId } }),
    ]);

    return {
      jobs: jobsCount,
      quotes: quotesCount,
      costings: costingsCount,
      activities: activitiesCount,
      inventory: inventoryCount,
      heroSettings: heroSettingsCount,
      brandingSettings: brandingSettingsCount,
      copySettings: copySettingsCount,
      botConversations: botConversationsCount,
      reviewSubmissions: reviewSubmissionsCount,
    };
  } catch (error) {
    // Log the error for debugging
    console.error("Error checking company references:", error);

    // Re-throw with a more descriptive message
    throw new Error(
      `Failed to check company references: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
