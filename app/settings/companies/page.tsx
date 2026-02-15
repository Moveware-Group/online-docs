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
import { Metadata } from "next";
import Link from "next/link";
import { Building2, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Company Management - Moveware App",
  description: "Manage companies and their settings",
};

export default function CompaniesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Company Management
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-md p-8">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Company Management
            </h2>
            <p className="text-gray-600">
              This page allows you to manage companies and their settings.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Note: This is a placeholder page. API endpoints are available at{" "}
              <code className="bg-gray-100 px-2 py-1 rounded">
                /api/companies
              </code>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
