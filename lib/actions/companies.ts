"use server";

/**
 * Server Actions for Company Mutations
 *
 * CACHE REVALIDATION STRATEGY:
 * --------------------------------
 * All mutation operations (create, update, delete) use Next.js revalidatePath()
 * to invalidate the cache for the companies list page. This ensures that:
 *
 * 1. After any mutation, the /settings/companies page will fetch fresh data
 * 2. No stale data is shown to users after changes
 * 3. Server-side rendering benefits are maintained
 * 4. No manual router.refresh() calls needed in client components
 *
 * Why revalidatePath over revalidateTag?
 * - revalidatePath is simpler and sufficient for single-page invalidation
 * - We invalidate the entire /settings/companies route
 * - If we need more granular control later, we can switch to revalidateTag
 *
 * Usage:
 * - Import actions in client components with 'use client'
 * - Call directly: await createCompany(formData)
 * - Actions return { success: true } or { error: string }
 * - Cache revalidation happens automatically after successful mutations
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";

type ActionResult =
  | { success: true; data?: any }
  | { success: false; error: string };

/**
 * Create a new company
 *
 * @param formData - Form data containing company details
 * @returns ActionResult with success status
 *
 * CACHE REVALIDATION:
 * After successful creation, revalidates /settings/companies to show the new company
 * in the list immediately without requiring a page refresh.
 */
export async function createCompany(formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get("name") as string;

    // Validate required fields
    if (!name || name.trim() === "") {
      return { success: false, error: "Company name is required" };
    }

    // Create company in database
    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        apiKey: randomUUID(),
      },
    });

    // CRITICAL: Revalidate the companies list page to show the new company
    revalidatePath("/settings/companies");

    return { success: true, data: company };
  } catch (error) {
    console.error("Error creating company:", error);

    // Handle unique constraint violations (duplicate company name)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "A company with this name already exists",
        };
      }
    }

    return {
      success: false,
      error: "Failed to create company. Please try again.",
    };
  }
}

/**
 * Update an existing company
 *
 * @param companyId - ID of the company to update
 * @param formData - Form data containing updated company details
 * @returns ActionResult with success status
 *
 * CACHE REVALIDATION:
 * After successful update, revalidates /settings/companies to reflect the changes
 * immediately in the list view.
 */
export async function updateCompany(
  companyId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const name = formData.get("name") as string;

    // Validate required fields
    if (!name || name.trim() === "") {
      return { success: false, error: "Company name is required" };
    }

    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return { success: false, error: "Company not found" };
    }

    // Update company in database
    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        name: name.trim(),
      },
    });

    // CRITICAL: Revalidate the companies list page to show updated data
    revalidatePath("/settings/companies");

    // Also revalidate the individual company page if it exists
    revalidatePath(`/settings/companies/${companyId}`);

    return { success: true, data: company };
  } catch (error) {
    console.error("Error updating company:", error);

    // Handle unique constraint violations
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "A company with this name already exists",
        };
      }
    }

    return {
      success: false,
      error: "Failed to update company. Please try again.",
    };
  }
}

/**
 * Delete a company
 *
 * @param companyId - ID of the company to delete
 * @returns ActionResult with success status
 *
 * CACHE REVALIDATION:
 * After successful deletion, revalidates /settings/companies to remove the deleted
 * company from the list immediately without requiring a page refresh.
 */
export async function deleteCompany(companyId: string): Promise<ActionResult> {
  try {
    // Check if company exists
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return { success: false, error: "Company not found" };
    }

    // Delete company
    await prisma.company.delete({
      where: { id: companyId },
    });

    // CRITICAL: Revalidate the companies list page to remove the deleted company
    revalidatePath("/settings/companies");

    return { success: true };
  } catch (error) {
    console.error("Error deleting company:", error);

    return {
      success: false,
      error: "Failed to delete company. Please try again.",
    };
  }
}
