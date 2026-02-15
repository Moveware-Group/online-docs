'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/lib/components/layout';
import { Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface Branding {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const coId = searchParams.get('coId');
  
  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBranding() {
      try {
        const response = await fetch('/api/settings/branding');
        if (response.ok) {
          const data = await response.json();
          setBranding({
            primaryColor: data?.primaryColor,
            secondaryColor: data?.secondaryColor,
            logoUrl: data?.logoUrl,
          });
        }
      } catch (err) {
        console.error('Error fetching branding:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBranding();
  }, []);

  const companyName = branding?.companyName || 'Moveware';
  const logoUrl = branding?.logoUrl;
  const primaryColor = branding?.primaryColor || '#c00';

  if (loading) {
    return (
      <PageShell includeHeader={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-12 h-12 animate-spin" style={{ color: primaryColor }} />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell includeHeader={false}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          {/* Logo */}
          <div className="text-center mb-8">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName}
                style={{ maxWidth: '250px' }}
                className="mx-auto"
              />
            ) : (
              <h1 className="text-3xl font-bold" style={{ color: primaryColor }}>{companyName}</h1>
            )}
          </div>

          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div 
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                <CheckCircle 
                  className="w-16 h-16" 
                  style={{ color: primaryColor }}
                />
              </div>
            </div>

            {/* Thank You Message */}
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-xl text-gray-600 mb-8">
              Your quote has been accepted successfully
            </p>

            {/* Details */}
            {jobId && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Reference Number:</span>
                    <span className="text-lg font-bold" style={{ color: primaryColor }}>#{jobId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <span className="w-2 h-2 rounded-full bg-green-600 mr-2"></span>
                      Accepted
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* What's Next */}
            <div className="mb-8 text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What happens next?</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    1
                  </div>
                  <p className="text-gray-700">
                    <span className="font-semibold">Confirmation Email</span> - You&apos;ll receive a confirmation email shortly with all the details.
                  </p>
                </li>
                <li className="flex items-start">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    2
                  </div>
                  <p className="text-gray-700">
                    <span className="font-semibold">We&apos;ll Contact You</span> - Our team will reach out within 24 hours to finalize the details.
                  </p>
                </li>
                <li className="flex items-start">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: primaryColor }}
                  >
                    3
                  </div>
                  <p className="text-gray-700">
                    <span className="font-semibold">Move Day Preparation</span> - We&apos;ll prepare everything for your scheduled move date.
                  </p>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="border-t border-gray-200 pt-6 mb-6">
              <p className="text-sm text-gray-600 mb-4">
                If you have any questions, please don&apos;t hesitate to contact us:
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">Email:</span> contact@moveware.com</p>
                <p><span className="font-medium">Phone:</span> 1300 MOVEWARE</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Home
              </Link>
              {jobId && (
                <button
                  onClick={() => {
                    const acceptanceId = sessionStorage.getItem('quoteAcceptanceId');
                    const params = new URLSearchParams();
                    params.set('jobId', jobId);
                    if (coId) params.set('coId', coId);
                    if (acceptanceId) params.set('acceptanceId', acceptanceId);
                    params.set('print', 'true');
                    window.open(`/quote?${params.toString()}`, '_blank');
                  }}
                  style={{ backgroundColor: primaryColor }}
                  className="px-6 py-3 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Print Confirmation
                </button>
              )}
            </div>
          </div>

          {/* Footer Note */}
          <p className="text-center text-sm text-gray-500 mt-8">
            A copy of this confirmation has been sent to your email address.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={
      <PageShell includeHeader={false}>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
      </PageShell>
    }>
      <ThankYouContent />
    </Suspense>
  );
}
