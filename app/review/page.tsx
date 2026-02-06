import { Suspense } from 'react';
import { PageShell } from '@/lib/components/layout';
import { Loader2 } from 'lucide-react';
import ReviewPageClient from './review-page-client';

export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading review...</p>
            </div>
          </div>
        </PageShell>
      }
    >
      <ReviewPageClient />
    </Suspense>
  );
}
