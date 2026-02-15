import Link from "next/link";
import { Plus } from "lucide-react";
import { CompaniesListView } from "@/lib/components/settings";
import { Company } from "@/lib/types/company";

// Fetch companies data
async function getCompanies(): Promise<Company[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/companies`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch companies:", response.statusText);
      return [];
    }

    const data = await response.json();
    return data.companies || [];
  } catch (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
}

export default async function CompaniesPage() {
  const companies = await getCompanies();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with title and Add Company button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          <p className="mt-2 text-base text-gray-600">
            Manage your company settings and configurations
          </p>
        </div>
        <Link
          href="/settings/companies/new"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Add new company"
        >
          <Plus className="w-5 h-5" aria-hidden="true" />
          <span>Add Company</span>
        </Link>
      </div>

      {/* Companies list */}
      <CompaniesListView companies={companies} />
    </div>
  );
}
