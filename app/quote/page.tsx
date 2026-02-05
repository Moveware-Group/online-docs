'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/lib/components/layout';
import { JobDetailsCard, InventoryTable, CostBreakdownCard } from '@/lib/components/quotes';
import { QuoteData } from '@/lib/types/quote';
import { Loader2, AlertCircle } from 'lucide-react';

export default function QuotePage() {
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuoteData();
  }, []);

  const fetchQuoteData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Get actual quote ID from URL params or context
      const quoteId = 'sample-quote-123';
      
      const response = await fetch(`/api/quotes/${quoteId}`);
      const result = await response.json();

      if (result.success && result.data) {
        setQuoteData(result.data);
      } else {
        setError(result.error || 'Failed to load quote data');
      }
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('An unexpected error occurred while loading the quote');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading quote details...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Quote</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchQuoteData}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!quoteData) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-600">No quote data available</p>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="min-h-screen bg-gray-50">
        {/* Page Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                  Online Quote
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Review your moving quote details and pricing
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Job Details Section */}
            <JobDetailsCard jobDetails={quoteData.jobDetails} />

            {/* Inventory Section */}
            <InventoryTable items={quoteData.inventory} />

            {/* Cost Breakdown Section */}
            <CostBreakdownCard costings={quoteData.costings} />
          </div>
        </div>

        {/* Footer Note */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Note:</span> This quote is valid for
              30 days from the date of issue. All prices are in Australian Dollars (AUD) and
              include GST. Final pricing may vary based on actual inventory and conditions at
              pickup and delivery locations.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
