"use server";

/**
 * Server Actions for Company Mutations
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
 */
export async function createCompany(formData: FormData): Promise<ActionResult> {
  try {
    const name = formData.get("name") as string;
    const brandCode = formData.get("brandCode") as string;
    const tenantId = (formData.get("tenantId") as string) || "default";
    const primaryColor = (formData.get("primaryColor") as string) || "#2563eb";
    const secondaryColor = (formData.get("secondaryColor") as string) || "#1e40af";
    const tertiaryColor = (formData.get("tertiaryColor") as string) || "#60a5fa";
    const logoUrl = formData.get("logoUrl") as string | null;

    // Validate required fields
    if (!name || name.trim() === "") {
      return { success: false, error: "Company name is required" };
    }

    if (!brandCode || brandCode.trim() === "") {
      return { success: false, error: "Brand code is required" };
    }

    // Create company in database
    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        brandCode: brandCode.trim(),
        tenantId: tenantId.trim(),
        apiKey: randomUUID(),
        primaryColor,
        secondaryColor,
        tertiaryColor,
        logoUrl: logoUrl || null,
      },
    });

    revalidatePath("/settings");
    revalidatePath("/settings/companies");

    return { success: true, data: company };
  } catch (error) {
    console.error("Error creating company:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "A company with this brand code already exists",
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
 */
export async function updateCompany(
  companyId: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const name = formData.get("name") as string;
    const brandCode = formData.get("brandCode") as string;
    const primaryColor = formData.get("primaryColor") as string | null;
    const secondaryColor = formData.get("secondaryColor") as string | null;
    const tertiaryColor = formData.get("tertiaryColor") as string | null;
    const logoUrl = formData.get("logoUrl") as string | null;

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

    // Build update data
    const updateData: any = {
      name: name.trim(),
    };

    if (brandCode) updateData.brandCode = brandCode.trim();
    if (primaryColor) updateData.primaryColor = primaryColor;
    if (secondaryColor) updateData.secondaryColor = secondaryColor;
    if (tertiaryColor) updateData.tertiaryColor = tertiaryColor;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl || null;

    // Update company in database
    const company = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    revalidatePath("/settings");
    revalidatePath("/settings/companies");
    revalidatePath(`/settings/companies/${companyId}`);

    return { success: true, data: company };
  } catch (error) {
    console.error("Error updating company:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "A company with this brand code already exists",
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
 */
export async function deleteCompany(companyId: string): Promise<ActionResult> {
  try {
    const existingCompany = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existingCompany) {
      return { success: false, error: "Company not found" };
    }

    await prisma.company.delete({
      where: { id: companyId },
    });

    revalidatePath("/settings");
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
