/**
 * Database Reference Checker
 *
 * Utility functions for checking foreign key references before deletion operations.
 * Used to prevent deletion of records that have dependent data and provide
 * meaningful error messages about what would be affected.
 */

import { prisma } from "../db";
import { Prisma } from "@prisma/client";

export interface ReferenceCount {
  [tableName: string]: number;
}

export interface ReferenceCheckResult {
  hasReferences: boolean;
  totalReferences: number;
  references: ReferenceCount;
}

/**
 * Check all foreign key references to a company
 *
 * Queries all tables that have a companyId foreign key and counts
 * how many records reference the given company. This is used to
 * prevent deletion of companies that have dependent data and to
 * provide meaningful error messages.
 *
 * @param companyId - The ID of the company to check references for
 * @returns Object containing reference counts per table and summary info
 * @throws Error if database query fails
 *
 * @example
 * ```typescript
 * const result = await checkCompanyReferences('company-123')
 * if (result.hasReferences) {
 *   console.log(`Cannot delete: ${result.totalReferences} references found`)
 *   console.log(result.references) // { jobs: 5, quotes: 12, ... }
 * }
 * ```
 */
export async function checkCompanyReferences(
  companyId: string,
): Promise<ReferenceCheckResult> {
  try {
    // Query all tables that have foreign keys to companies table
    // Using Promise.all for parallel execution to improve performance
    const [
      jobCount,
      quoteCount,
      costingCount,
      activityCount,
      inventoryCount,
      heroSettingsCount,
      brandingSettingsCount,
      copySettingsCount,
      reviewSubmissionCount,
      botConversationCount,
    ] = await Promise.all([
      prisma.job.count({ where: { companyId } }),
      prisma.quote.count({ where: { companyId } }),
      prisma.costing.count({ where: { companyId } }),
      prisma.activity.count({ where: { companyId } }),
      prisma.inventory.count({ where: { companyId } }),
      prisma.heroSettings.count({ where: { companyId } }),
      prisma.brandingSettings.count({ where: { companyId } }),
      prisma.copySettings.count({ where: { companyId } }),
      prisma.reviewSubmission.count({ where: { companyId } }),
      prisma.botConversation.count({ where: { companyId } }),
    ]);

    // Build references object with counts per table
    const references: ReferenceCount = {
      jobs: jobCount,
      quotes: quoteCount,
      costings: costingCount,
      activities: activityCount,
      inventory: inventoryCount,
      heroSettings: heroSettingsCount,
      brandingSettings: brandingSettingsCount,
      copySettings: copySettingsCount,
      reviewSubmissions: reviewSubmissionCount,
      botConversations: botConversationCount,
    };

    // Calculate total references
    const totalReferences = Object.values(references).reduce(
      (sum, count) => sum + count,
      0,
    );

    return {
      hasReferences: totalReferences > 0,
      totalReferences,
      references,
    };
  } catch (error) {
    // Handle Prisma-specific errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error(
        `Database error while checking company references: ${error.message} (Code: ${error.code})`,
      );
    }

    // Handle Prisma validation errors
    if (error instanceof Prisma.PrismaClientValidationError) {
      throw new Error(
        `Invalid company ID or query parameters: ${error.message}`,
      );
    }

    // Handle other errors
    if (error instanceof Error) {
      throw new Error(`Failed to check company references: ${error.message}`);
    }

    // Fallback for unknown errors
    throw new Error("Unknown error occurred while checking company references");
  }
}

/**
 * Get a human-readable message about company references
 *
 * Checks company references and returns a formatted message
 * suitable for displaying to users or in error messages.
 *
 * @param companyId - The ID of the company
 * @returns A formatted message describing the references
 * @throws Error if database query fails
 *
 * @example
 * ```typescript
 * try {
 *   await deleteCompany(companyId)
 * } catch (error) {
 *   const message = await getCompanyReferencesMessage(companyId)
 *   console.error(message)
 * }
 * ```
 */
export async function getCompanyReferencesMessage(
  companyId: string,
): Promise<string> {
  const result = await checkCompanyReferences(companyId);

  if (!result.hasReferences) {
    return "No references found. Company can be safely deleted.";
  }

  // Build list of tables with references
  const referenceParts: string[] = [];
  Object.entries(result.references).forEach(([table, count]) => {
    if (count > 0) {
      referenceParts.push(`${count} ${table}`);
    }
  });

  return `Cannot delete company. It is referenced by: ${referenceParts.join(", ")}. Total: ${result.totalReferences} references.`;
}

/**
 * Get only tables with non-zero reference counts
 *
 * Useful for displaying only relevant information to users.
 *
 * @param companyId - The ID of the company
 * @returns Object with only tables that have references
 * @throws Error if database query fails
 */
export async function getNonEmptyReferences(
  companyId: string,
): Promise<ReferenceCount> {
  const result = await checkCompanyReferences(companyId);

  const nonEmptyReferences: ReferenceCount = {};
  Object.entries(result.references).forEach(([table, count]) => {
    if (count > 0) {
      nonEmptyReferences[table] = count;
    }
  });

  return nonEmptyReferences;
}
