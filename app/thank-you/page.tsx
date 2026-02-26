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
  footerPhone?: string;
  footerEmail?: string;
  footerAddressLine1?: string;
  footerAddressLine2?: string;
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const jobId   = searchParams.get('jobId');
  const coId    = searchParams.get('coId');
  const quoteId = searchParams.get('quoteId');

  const [branding, setBranding] = useState<Branding | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function fetchBranding() {
      try {
        // Use the job endpoint with coId so we always get the correct
        // company branding (same data source as the quote page itself).
        if (jobId && coId) {
          const res = await fetch(`/api/jobs/${jobId}?coId=${coId}`);
          if (res.ok) {
            const json = await res.json();
            const b = json?.data?.branding;
            if (b) {
              setBranding({
                companyName:      b.companyName,
                logoUrl:          b.logoUrl,
                primaryColor:     b.primaryColor,
                secondaryColor:   b.secondaryColor,
                footerPhone:      b.footerPhone,
                footerEmail:      b.footerEmail,
                footerAddressLine1: b.footerAddressLine1,
                footerAddressLine2: b.footerAddressLine2,
              });
              return;
            }
          }
        }
        // Fallback: generic branding endpoint (no coId available)
        const res = await fetch('/api/settings/branding');
        if (res.ok) {
          const data = await res.json();
          setBranding({
            primaryColor: data?.primaryColor,
            logoUrl:      data?.logoUrl,
          });
        }
      } catch (err) {
        console.error('Error fetching branding:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBranding();
  }, [jobId, coId]);

  const companyName  = branding?.companyName  || 'Moveware';
  const logoUrl      = branding?.logoUrl;
  const primaryColor = branding?.primaryColor || '#1E40AF';
  const contactEmail = branding?.footerEmail  || '';
  const contactPhone = branding?.footerPhone  || '';
  const address1     = branding?.footerAddressLine1 || '';
  const address2     = branding?.footerAddressLine2 || '';

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
                style={{ backgroundColor: `${primaryColor}20` }}
              >
                <CheckCircle className="w-16 h-16" style={{ color: primaryColor }} />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-xl text-gray-600 mb-8">
              Your quote has been accepted successfully
            </p>

            {/* Reference / Status */}
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

            {/* What happens next */}
            <div className="mb-8 text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What happens next?</h3>
              <ul className="space-y-3">
                {[
                  { n: 1, title: 'Confirmation Email',   body: "You'll receive a confirmation email shortly with all the details." },
                  { n: 2, title: "We'll Contact You",    body: 'Our team will reach out within 24 hours to finalize the details.' },
                  { n: 3, title: 'Move Day Preparation', body: "We'll prepare everything for your scheduled move date." },
                ].map(({ n, title, body }) => (
                  <li key={n} className="flex items-start">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {n}
                    </div>
                    <p className="text-gray-700">
                      <span className="font-semibold">{title}</span> - {body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info — driven by company branding settings */}
            {(contactEmail || contactPhone || address1) && (
              <div className="border-t border-gray-200 pt-6 mb-6">
                <p className="text-sm text-gray-600 mb-3">
                  If you have any questions, please don&apos;t hesitate to contact us:
                </p>
                <div className="text-sm text-gray-700 space-y-1">
                  {address1     && <p>{address1}</p>}
                  {address2     && <p>{address2}</p>}
                  {contactEmail && <p><span className="font-medium">Email:</span> {contactEmail}</p>}
                  {contactPhone && <p><span className="font-medium">Phone:</span> {contactPhone}</p>}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center mt-6">
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
                    if (coId)         params.set('coId',        coId);
                    if (quoteId)      params.set('quoteId',     quoteId);
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
