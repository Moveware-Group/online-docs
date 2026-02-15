import { PageShell } from "@/lib/components/layout";
import Link from "next/link";

export default function CompaniesSettingsPage() {
  return (
    <PageShell>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Company Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage company configuration and branding settings.
            </p>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Settings Overview
            </h2>
            <p className="text-gray-600 mb-4">
              Use the API endpoints to update company details, colors, and
              logos.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Back to Settings
            </Link>
          </div>
        </main>
      </div>
    </PageShell>
  );
}
