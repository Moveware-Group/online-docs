'use client';

import { useEffect, useState } from 'react';
import { PageShell } from '@/lib/components/layout';
import { Loader2 } from 'lucide-react';

interface HeroSettings {
  id: string;
  title: string;
  subtitle: string;
  backgroundImage?: string;
  backgroundColor?: string;
  textColor?: string;
  companyId: string;
}

interface BrandingSettings {
  id: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  companyName?: string;
  companyId: string;
}

interface CopySettings {
  id: string;
  introText?: string;
  bodyText?: string;
  footerText?: string;
  companyId: string;
}

export default function PerformanceReviewPage() {
  const [hero, setHero] = useState<HeroSettings | null>(null);
  const [branding, setBranding] = useState<BrandingSettings | null>(null);
  const [copy, setCopy] = useState<CopySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        setError(null);

        // Get company ID from URL params (for multi-company support)
        const urlParams = new URLSearchParams(window.location.search);
        const companyId = urlParams.get('coId') || '1'; // Default to '1' if not provided

        // Fetch all settings in parallel
        const [heroRes, brandingRes, copyRes] = await Promise.all([
          fetch(`/api/settings/hero?companyId=${companyId}`),
          fetch(`/api/settings/branding?companyId=${companyId}`),
          fetch(`/api/settings/copy?companyId=${companyId}`)
        ]);

        if (!heroRes.ok || !brandingRes.ok || !copyRes.ok) {
          throw new Error('Failed to fetch settings');
        }

        const heroData = await heroRes.json();
        const brandingData = await brandingRes.json();
        const copyData = await copyRes.json();

        setHero(heroData);
        setBranding(brandingData);
        setCopy(copyData);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load page settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  if (loading) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading performance review...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
              <p className="text-red-800 font-medium">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            >
              Retry
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // Extract settings with defaults
  const heroTitle = hero?.title || 'Performance Review';
  const heroSubtitle = hero?.subtitle || 'Track and analyze your team performance';
  const heroBackground = hero?.backgroundColor || 'from-blue-600 to-blue-800';
  const heroTextColor = hero?.textColor || 'text-white';
  const companyName = branding?.companyName || 'Moveware';
  const logoUrl = branding?.logoUrl;
  const primaryColor = branding?.primaryColor || '#2563eb';
  const introText = copy?.introText || 'Welcome to your performance review dashboard';
  const bodyText = copy?.bodyText || 'Here you can review team performance metrics and insights';
  const footerText = copy?.footerText;

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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-32">
            <div className="max-w-3xl">
              {/* Company Logo/Name */}
              {logoUrl ? (
                <div className="mb-8">
                  <img 
                    src={logoUrl} 
                    alt={`${companyName} logo`} 
                    className="h-12 w-auto"
                  />
                </div>
              ) : (
                <div className="mb-8">
                  <h3 className="text-2xl font-bold opacity-90">{companyName}</h3>
                </div>
              )}

              {/* Hero Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                {heroTitle}
              </h1>

              {/* Hero Subtitle */}
              <p className="text-xl sm:text-2xl text-blue-100 mb-8">
                {heroSubtitle}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  className="bg-white hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg shadow-lg transition-all duration-200"
                  style={{ color: primaryColor }}
                >
                  View Metrics
                </button>
                <button className="bg-blue-700 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg border-2 border-blue-400 transition-all duration-200">
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                {introText}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {bodyText}
              </p>
            </div>
          </div>
        </section>

        {/* Performance Metrics Section */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
              Key Performance Indicators
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Metric Card 1 */}
              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-200">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Team Efficiency</h3>
                <p className="text-gray-600 mb-4">Track overall team productivity and output</p>
                <div className="text-3xl font-bold" style={{ color: primaryColor }}>92%</div>
              </div>

              {/* Metric Card 2 */}
              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-200">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Quality Score</h3>
                <p className="text-gray-600 mb-4">Measure work quality and accuracy</p>
                <div className="text-3xl font-bold" style={{ color: primaryColor }}>8.7/10</div>
              </div>

              {/* Metric Card 3 */}
              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-200">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <svg className="w-6 h-6" style={{ color: primaryColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">On-Time Delivery</h3>
                <p className="text-gray-600 mb-4">Projects completed within deadline</p>
                <div className="text-3xl font-bold" style={{ color: primaryColor }}>88%</div>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity Section */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">
              Recent Performance Highlights
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Project Alpha Completed</h4>
                    <p className="text-gray-600">Successfully delivered ahead of schedule with exceptional quality standards</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Completed
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Customer Satisfaction Rating</h4>
                    <p className="text-gray-600">Received outstanding feedback from client stakeholders</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    Excellent
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration Milestone</h4>
                    <p className="text-gray-600">Achieved new benchmark in cross-functional teamwork</p>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Achievement
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        {footerText && (
          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <p className="text-center text-gray-600">{footerText}</p>
            </div>
          </footer>
        )}
      </div>
    </PageShell>
  );
}
