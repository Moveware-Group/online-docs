/**
 * Companies List View Component
 *
 * CACHE REVALIDATION INTEGRATION:
 * --------------------------------
 * This component uses Server Actions from lib/actions/companies.ts for all mutations.
 * Server Actions automatically handle cache revalidation via revalidatePath().
 *
 * Benefits:
 * 1. No manual router.refresh() calls needed
 * 2. Cache invalidation happens server-side for consistency
 * 3. Works seamlessly with Server Components
 * 4. Optimistic UI updates possible with useTransition
 *
 * If you need to use API routes instead (e.g., for file uploads), remember to:
 * 1. Import useRouter from 'next/navigation'
 * 2. Call router.refresh() after successful mutations
 * 3. Handle loading states manually
 */

"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteCompany } from "@/lib/actions/companies";
import { CompanyLogo } from "@/lib/components/ui/company-logo";

export interface Company {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
  settings?: {
    enableInventory?: boolean;
    enableCostings?: boolean;
  };
}

interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

interface CompaniesListViewProps {
  companies: Company[];
  pagination: PaginationMetadata;
  error?: string | null;
}

export default function CompaniesListView({
  companies,
  pagination,
  error,
}: CompaniesListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /**
   * Handle company deletion
   *
   * CACHE REVALIDATION:
   * Uses Server Action deleteCompany() which automatically calls
   * revalidatePath('/settings/companies') after successful deletion.
   * The useTransition hook provides pending state for optimistic UI.
   */
  const handleDelete = async (companyId: string, companyName: string) => {
    if (!confirm(`Are you sure you want to delete ${companyName}?`)) {
      return;
    }

    setDeletingId(companyId);

    // Use startTransition for automatic UI updates after server mutation
    startTransition(async () => {
      const result = await deleteCompany(companyId);

      if (result.success) {
        // Success! The Server Action already called revalidatePath()
        // Next.js will automatically re-render with fresh data
        console.log("Company deleted successfully");
      } else {
        // Show error to user
        alert(`Failed to delete company: ${result.error}`);
      }

      setDeletingId(null);
    });
  };

  /**
   * Handle navigation to add company page
   */
  const handleAddCompany = () => {
    router.push("/settings/companies/new");
  };

  /**
   * Handle navigation to edit company page
   */
  const handleEdit = (companyId: string) => {
    router.push(`/settings/companies/${companyId}/edit`);
  };

  /**
   * Handle pagination navigation
   */
  const handlePageChange = (newPage: number) => {
    const coId = searchParams.get("coId");
    const url = `/settings/companies?page=${newPage}${coId ? `&coId=${coId}` : ""}`;
    router.push(url);
  };

  // Show error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-xl font-bold text-red-900 mb-2">
          Error Loading Companies
        </h3>
        <p className="text-red-700 mb-6">{error}</p>
        <button
          onClick={() => router.refresh()}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty state
  if (companies.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Companies Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Get started by adding your first company to manage settings and
            configurations.
          </p>
          <button
            onClick={handleAddCompany}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5 inline-block mr-2" />
            Add First Company
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
          <p className="text-gray-600 mt-1">
            Manage your companies and their settings
          </p>
        </div>
        <button
          onClick={handleAddCompany}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5 inline-block mr-2" />
          Add Company
        </button>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Company
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Code
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <CompanyLogo
                          name={company.name}
                          logoUrl={company.logoUrl}
                          size={40}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {company.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(company.id)}
                        disabled={isPending}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                        aria-label={`Edit ${company.name}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        disabled={isPending || deletingId === company.id}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        aria-label={`Delete ${company.name}`}
                      >
                        {deletingId === company.id ? (
                          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total companies)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevious || isPending}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasMore || isPending}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
