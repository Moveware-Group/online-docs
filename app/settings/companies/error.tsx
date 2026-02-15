"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, LogIn } from "lucide-react";

/**
 * Error boundary for companies list page
 * Handles authentication (401) and permission (403) errors
 */
export default function CompaniesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log auth errors for debugging
    if (error) {
      console.error("Companies page error:", {
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }, [error]);

  // Check if it's an authentication error (401)
  const isAuthError =
    error.message?.toLowerCase().includes("401") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("authentication required");

  // Check if it's a permission error (403)
  const isPermissionError =
    error.message?.toLowerCase().includes("403") ||
    error.message?.toLowerCase().includes("forbidden") ||
    error.message?.toLowerCase().includes("permission denied");

  // Handle 401 - Redirect to login with return URL
  if (isAuthError) {
    const redirectUrl = encodeURIComponent("/settings/companies");

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 mb-6">
              You need to log in to access the companies page.
            </p>
            <Link
              href={`/login?redirect_uri=${redirectUrl}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle 403 - Permission Denied
  if (isPermissionError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Permission Denied
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access the companies page. Please
              contact your administrator for access.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              <Home className="w-5 h-5 mr-2" />
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handle other errors - Generic error with retry
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            {error.message ||
              "An unexpected error occurred while loading the companies page."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg border border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
