import { Suspense } from 'react';
import { PageShell } from '@/lib/components/layout';
import { QuestionsContainer } from '@/lib/components/performance';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';

interface PerformancePageProps {
  params: Promise<{
    jobId: string;
  }>;
  searchParams: Promise<{
    coId?: string;
  }>;
}

export default async function PerformancePage({ params, searchParams }: PerformancePageProps) {
  const { jobId } = await params;
  const { coId } = await searchParams;

  // Validate company ID
  const companyId = coId ? parseInt(coId) : 1;

  return (
    <PageShell>
      <div className="min-h-screen bg-gray-50 pb-12">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Link
              href={`/jobs/${jobId}?coId=${coId || ''}`}
              className="inline-flex items-center gap-2 text-blue-100 hover:text-white transition-colors duration-200 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Job Details</span>
            </Link>

            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                  Performance Review
                </h1>
                <p className="text-xl text-blue-100">
                  Job #{jobId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <Suspense
            fallback={
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading performance review...</p>
              </div>
            }
          >
            <QuestionsContainer jobId={jobId} companyId={companyId} />
          </Suspense>
        </div>
      </div>
    </PageShell>
  );
}
