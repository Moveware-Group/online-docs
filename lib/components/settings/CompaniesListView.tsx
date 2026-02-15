"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Edit2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { CompanyLogo } from "@/lib/components/ui/company-logo";

interface Company {
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

export function CompaniesListView({
  companies,
  pagination,
  error,
}: CompaniesListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const coId = searchParams.get("coId");

  const handleAddCompany = () => {
    const url = coId
      ? `/settings/companies/new?coId=${coId}`
      : "/settings/companies/new";
    router.push(url);
  };

  const handleEditCompany = (companyId: string) => {
    const url = coId
      ? `/settings/companies/${companyId}?coId=${coId}`
      : `/settings/companies/${companyId}`;
    router.push(url);
  };

  const handlePageChange = (newPage: number) => {
    const url = coId
      ? `/settings/companies?page=${newPage}&coId=${coId}`
      : `/settings/companies?page=${newPage}`;
    router.push(url);
  };

  // Show error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Error Loading Companies
            </h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state
  if (companies.length === 0 && pagination.page === 1) {
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
            Get started by adding your first company to the system.
          </p>
          <button
            onClick={handleAddCompany}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <Plus className="w-5 h-5 inline-block mr-2 -mt-1" />
            Add Company
          </button>
        </div>
      </div>
    );
  }

  // Calculate display range
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  // Show warning if total count is very high
  const showLimitWarning = pagination.total > 100;

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-600 mt-1">
            Showing {startItem}-{endItem} of {pagination.total}{" "}
            {pagination.total === 1 ? "company" : "companies"}
          </p>
        </div>
        <button
          onClick={handleAddCompany}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5 inline-block mr-2 -mt-1" />
          Add Company
        </button>
      </div>

      {/* Warning banner for large datasets */}
      {showLimitWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900">
                Large Company List
              </h4>
              <p className="text-sm text-amber-700 mt-1">
                You have {pagination.total} companies. Use pagination to browse
                through the list. Search and filter features will be available
                in a future update.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Companies Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CompanyLogo
                        name={company.name}
                        logoUrl={company.logoUrl}
                        size={40}
                      />
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
                    <button
                      onClick={() => handleEditCompany(company.id)}
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrevious}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasMore}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> of{" "}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrevious}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasMore}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
