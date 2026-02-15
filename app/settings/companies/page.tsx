import CompaniesListView from "@/lib/components/settings/CompaniesListView";
import { redirect } from "next/navigation";

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

interface CompaniesResponse {
  companies: Company[];
  pagination: PaginationMetadata;
}

interface PageProps {
  searchParams: Promise<{ page?: string; coId?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const coId = params.coId;

  // Validate page number
  if (page < 1) {
    redirect("/settings/companies?page=1" + (coId ? `&coId=${coId}` : ""));
  }

  // Fetch companies with pagination
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const apiUrl = `${baseUrl}/api/companies?page=${page}&limit=50`;

  let response: CompaniesResponse;
  let error: string | null = null;

  try {
    const res = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.status === 401) {
      error = "Authentication required. Please log in to view companies.";
      response = {
        companies: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasMore: false,
          hasPrevious: false,
        },
      };
    } else if (res.status === 403) {
      error = "Access denied. You do not have permission to view companies.";
      response = {
        companies: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
          hasMore: false,
          hasPrevious: false,
        },
      };
    } else if (!res.ok) {
      throw new Error(`Failed to fetch companies: ${res.statusText}`);
    } else {
      response = await res.json();

      // Validate response structure
      if (!response.companies || !response.pagination) {
        throw new Error("Invalid response format from API");
      }

      // Redirect to last page if requested page is beyond total pages
      if (
        response.pagination.totalPages > 0 &&
        page > response.pagination.totalPages
      ) {
        redirect(
          `/settings/companies?page=${response.pagination.totalPages}` +
            (coId ? `&coId=${coId}` : ""),
        );
      }
    }
  } catch (err) {
    console.error("Error fetching companies:", err);
    error = "Failed to load companies. Please try again later.";
    response = {
      companies: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
        hasMore: false,
        hasPrevious: false,
      },
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CompaniesListView
          companies={response.companies}
          pagination={response.pagination}
          error={error}
        />
      </div>
    </div>
  );
}
