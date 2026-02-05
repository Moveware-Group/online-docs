'use client';

import { useState, useEffect } from 'react';
import { PageShell } from '@/lib/components/layout';
import { Button } from '@/lib/components/ui';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface BrandingSettings {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

interface HeroSettings {
  imageUrl: string;
  title: string;
  subtitle: string;
}

interface CopySettings {
  welcomeMessage: string;
  ctaText: string;
  footerText: string;
}

type TabType = 'branding' | 'hero' | 'copy';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('branding');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Branding state
  const [branding, setBranding] = useState<BrandingSettings>({
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#60a5fa',
  });

  // Hero state
  const [hero, setHero] = useState<HeroSettings>({
    imageUrl: '',
    title: '',
    subtitle: '',
  });

  // Copy state
  const [copy, setCopy] = useState<CopySettings>({
    welcomeMessage: '',
    ctaText: '',
    footerText: '',
  });

  // Load existing settings
  useEffect(() => {
    const loadSettings = async () => {
      setLoadingData(true);
      try {
        // Load branding
        const brandingRes = await fetch('/api/settings/branding');
        if (brandingRes.ok) {
          const brandingData = await brandingRes.json();
          if (brandingData) {
            setBranding({
              logoUrl: brandingData.logoUrl || '',
              primaryColor: brandingData.primaryColor || '#2563eb',
              secondaryColor: brandingData.secondaryColor || '#60a5fa',
            });
          }
        }

        // Load hero
        const heroRes = await fetch('/api/settings/hero');
        if (heroRes.ok) {
          const heroData = await heroRes.json();
          if (heroData) {
            setHero({
              imageUrl: heroData.imageUrl || '',
              title: heroData.title || '',
              subtitle: heroData.subtitle || '',
            });
          }
        }

        // Load copy
        const copyRes = await fetch('/api/settings/copy');
        if (copyRes.ok) {
          const copyData = await copyRes.json();
          if (copyData) {
            setCopy({
              welcomeMessage: copyData.welcomeMessage || '',
              ctaText: copyData.ctaText || '',
              footerText: copyData.footerText || '',
            });
          }
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      let endpoint = '';
      let data = {};

      switch (activeTab) {
        case 'branding':
          endpoint = '/api/settings/branding';
          data = branding;
          break;
        case 'hero':
          endpoint = '/api/settings/hero';
          data = hero;
          break;
        case 'copy':
          endpoint = '/api/settings/copy';
          data = copy;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }

      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'branding' as TabType, label: 'Branding' },
    { id: 'hero' as TabType, label: 'Hero Content' },
    { id: 'copy' as TabType, label: 'Copy' },
  ];

  if (loadingData) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-base text-gray-600 mt-2">
            Configure your application branding, hero content, and copy.
          </p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Branding Settings</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Configure your application's logo and color scheme.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  value={branding.logoUrl}
                  onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-gray-500">Enter the full URL to your logo image</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="primaryColor" className="block text-sm font-medium text-gray-700">
                    Primary Color
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      id="primaryColor"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.primaryColor}
                      onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
                      placeholder="#2563eb"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="secondaryColor" className="block text-sm font-medium text-gray-700">
                    Secondary Color
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      id="secondaryColor"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="h-12 w-20 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={branding.secondaryColor}
                      onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors font-mono"
                      placeholder="#60a5fa"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hero' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Hero Content</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Configure the hero section of your homepage.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="heroImageUrl" className="block text-sm font-medium text-gray-700">
                  Hero Image URL
                </label>
                <input
                  type="url"
                  id="heroImageUrl"
                  value={hero.imageUrl}
                  onChange={(e) => setHero({ ...hero, imageUrl: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="https://example.com/hero-image.jpg"
                />
                <p className="text-xs text-gray-500">Enter the full URL to your hero background image</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="heroTitle" className="block text-sm font-medium text-gray-700">
                  Hero Title
                </label>
                <input
                  type="text"
                  id="heroTitle"
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Welcome to Our Service"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="heroSubtitle" className="block text-sm font-medium text-gray-700">
                  Hero Subtitle
                </label>
                <textarea
                  id="heroSubtitle"
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="A brief description of your service"
                />
              </div>
            </div>
          )}

          {activeTab === 'copy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Copy Content</h2>
                <p className="text-sm text-gray-600 mb-6">
                  Edit the text content throughout your application.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="welcomeMessage" className="block text-sm font-medium text-gray-700">
                  Welcome Message
                </label>
                <textarea
                  id="welcomeMessage"
                  value={copy.welcomeMessage}
                  onChange={(e) => setCopy({ ...copy, welcomeMessage: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Enter your welcome message..."
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700">
                  Call-to-Action Text
                </label>
                <input
                  type="text"
                  id="ctaText"
                  value={copy.ctaText}
                  onChange={(e) => setCopy({ ...copy, ctaText: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Get Started"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="footerText" className="block text-sm font-medium text-gray-700">
                  Footer Text
                </label>
                <textarea
                  id="footerText"
                  value={copy.footerText}
                  onChange={(e) => setCopy({ ...copy, footerText: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  placeholder="Enter your footer text..."
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
