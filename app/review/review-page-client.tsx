'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageShell } from '@/lib/components/layout';
import { QuestionsContainer } from '@/lib/components/performance';
import { Loader2 } from 'lucide-react';

interface HeroSettings {
  id: string;
  companyId: string;
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor: string;
  textColor: string;
  showLogo: boolean;
  alignment: 'left' | 'center' | 'right';
  updatedAt: string;
}

interface BrandingSettings {
  id: string;
  companyId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  updatedAt: string;
}

export default function ReviewPageClient() {
  const searchParams = useSearchParams();
  const [hero, setHero] = useState<HeroSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const jobId = searchParams.get('jobId');
  const token = searchParams.get('token');
  const coId = searchParams.get('coId');

  useEffect(() => {
    async function fetchSettings() {
      if (!jobId || !token) {
        setError('Missing required parameters: jobId and token');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch branding and hero settings
        const [heroRes, brandingRes] = await Promise.all([
          fetch('/api/settings/hero'),
          fetch('/api/settings/branding')
        ]);

        const heroData = heroRes.ok ? await heroRes.json() : null;
        const brandingData = brandingRes.ok ? await brandingRes.json() : null;

        setHero(heroData);
        setBranding(brandingData);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load review. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [jobId, token]);

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading review...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !jobId || !token) {
    return (
      <PageShell>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-md p-8 max-w-md mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">❌</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">
              {error || 'Missing required parameters. Please check your link and try again.'}
            </p>
          </div>
        </div>
      </PageShell>
    );
  }

  // Extract styling from hero and branding
  const heroTitle = hero?.title || 'Performance Review';
  const heroSubtitle = hero?.subtitle || 'Share your feedback';
  const heroBackground = hero?.backgroundColor || 'from-blue-600 to-blue-800';
  const heroTextColor = hero?.textColor || 'text-white';
  const companyName = branding?.companyId || 'Moveware';
  const logoUrl = branding?.logoUrl;
  const primaryColor = branding?.primaryColor || '#2563eb';

  // Parse company ID with fallback
  const companyId = coId ? parseInt(coId) : 1;

  return (
    <PageShell>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section 
          className={`bg-gradient-to-r ${heroBackground} ${heroTextColor}`}
          style={{
            backgroundColor: hero?.backgroundColor ? hero.backgroundColor : undefined
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
            <div className="max-w-3xl">
              {/* Company Logo/Name */}
              {logoUrl ? (
                <div className="mb-6">
                  <img 
                    src={logoUrl} 
                    alt={`${companyName} logo`} 
                    className="h-10 w-auto"
                  />
                </div>
              ) : (
                <div className="mb-6">
                  <h3 className="text-xl font-bold opacity-90">{companyName}</h3>
                </div>
              )}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
                {heroTitle}
              </h1>
              <p className="text-lg sm:text-xl opacity-90">
                {heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Questions Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-12">
          <QuestionsContainer jobId={jobId} companyId={companyId} />
        </div>
      </div>
    </PageShell>
  );
}
