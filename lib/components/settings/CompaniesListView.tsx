"use client";

import { Edit2, Trash2, Building2 } from "lucide-react";

/**
 * Company interface matching the structure from OD-796
 */
interface Company {
  id: string;
  name: string;
  logoUrl?: string | null;
}

interface CompaniesListViewProps {
  companies: Company[];
  onEdit?: (company: Company) => void;
  onDelete?: (company: Company) => void;
}

/**
 * Responsive companies list component
 * - Desktop: Table layout with logo, name, and actions
 * - Mobile: Card layout for better mobile UX
 */
export default function CompaniesListView({
  companies,
  onEdit,
  onDelete,
}: CompaniesListViewProps) {
  return (
    <div className="space-y-6">
      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <table
          className="w-full"
          role="table"
          aria-label="Companies list table"
        >
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                aria-label="Company logo"
              >
                Logo
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-sm font-semibold text-gray-900"
                aria-label="Company name"
              >
                Company Name
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-right text-sm font-semibold text-gray-900"
                aria-label="Actions"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {companies.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Building2 className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="text-base font-medium">No companies found</p>
                    <p className="text-sm mt-1">
                      Add your first company to get started
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr
                  key={company.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 w-20">
                    {company.logoUrl ? (
                      <img
                        src={company.logoUrl}
                        alt={`${company.name} logo`}
                        className="w-12 h-12 rounded-lg object-cover shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-base font-medium text-gray-900">
                      {company.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(company)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                          aria-label={`Edit ${company.name}`}
                        >
                          <Edit2 className="w-4 h-4 inline-block mr-1" />
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(company)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold py-2 px-4 rounded-lg transition-all duration-200"
                          aria-label={`Delete ${company.name}`}
                        >
                          <Trash2 className="w-4 h-4 inline-block mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on mobile */}
      <div
        className="md:hidden space-y-4"
        role="list"
        aria-label="Companies list"
      >
        {companies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Building2 className="w-12 h-12 mb-4 text-gray-400" />
              <p className="text-base font-medium">No companies found</p>
              <p className="text-sm mt-1">
                Add your first company to get started
              </p>
            </div>
          </div>
        ) : (
          companies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
              role="listitem"
            >
              <div className="flex items-start gap-4 mb-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                    className="w-16 h-16 rounded-lg object-cover shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {company.name}
                  </h3>
                </div>
              </div>
              <div className="flex gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(company)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                    aria-label={`Edit ${company.name}`}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(company)}
                    className="flex-1 bg-white hover:bg-gray-50 text-red-600 font-semibold py-3 px-4 rounded-lg border border-red-300 shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                    aria-label={`Delete ${company.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
