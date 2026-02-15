'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Loader2, AlertCircle, Check } from 'lucide-react';

interface CompanyBranding {
  id?: string;
  companyId: string;
  brandCode: string;
  companyName: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  fontFamily: string;
  heroHeading?: string;
  heroSubheading?: string;
  heroCtaText?: string;
  heroCtaUrl?: string;
  heroImageUrl?: string;
  tagline?: string;
  description?: string;
  metaDescription?: string;
}

function CompanyForm({
  company,
  onSave,
  onCancel,
  loading,
}: {
  company: CompanyBranding | null;
  onSave: (company: CompanyBranding) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<CompanyBranding>(
    company || {
      companyId: '',
      brandCode: '',
      companyName: '',
      logoUrl: '',
      primaryColor: '#c00',
      secondaryColor: '#fff',
      tertiaryColor: '#5a5a5a',
      fontFamily: 'Inter',
      heroHeading: '',
      heroSubheading: '',
      heroCtaText: '',
      heroCtaUrl: '',
      heroImageUrl: '',
      tagline: '',
      description: '',
      metaDescription: '',
    }
  );

  return (
    <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {company?.id ? 'Edit Company' : 'Add New Company'}
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyId}
              onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12"
            />
            <p className="text-xs text-gray-500 mt-1">Numeric company ID</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.brandCode}
              onChange={(e) => setFormData({ ...formData, brandCode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="MWB"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Crown Worldwide"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo URL
          </label>
          <input
            type="text"
            value={formData.logoUrl}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="/images/company-logo.svg"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Primary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tertiary Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={formData.tertiaryColor}
                onChange={(e) => setFormData({ ...formData, tertiaryColor: e.target.value })}
                className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.tertiaryColor}
                onChange={(e) => setFormData({ ...formData, tertiaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Family
          </label>
          <input
            type="text"
            value={formData.fontFamily}
            onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Inter"
          />
        </div>

        {/* Hero Section */}
        <div className="pt-6 border-t border-gray-300">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Hero Content</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Image URL</label>
              <input
                type="text"
                value={formData.heroImageUrl || ''}
                onChange={(e) => setFormData({ ...formData, heroImageUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/hero.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Heading</label>
              <input
                type="text"
                value={formData.heroHeading || ''}
                onChange={(e) => setFormData({ ...formData, heroHeading: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Welcome to Our Service"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subheading</label>
              <textarea
                value={formData.heroSubheading || ''}
                onChange={(e) => setFormData({ ...formData, heroSubheading: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text</label>
                <input
                  type="text"
                  value={formData.heroCtaText || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Get Started"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CTA URL</label>
                <input
                  type="text"
                  value={formData.heroCtaUrl || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/quote"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Copy Section */}
        <div className="pt-6 border-t border-gray-300">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Copy Content</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <input
                type="text"
                value={formData.tagline || ''}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Your moving partner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Company description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
              <textarea
                value={formData.metaDescription || ''}
                onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="SEO meta description"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-300">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={loading || !formData.companyId || !formData.brandCode || !formData.companyName}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Company'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Companies state
  const [companies, setCompanies] = useState<CompanyBranding[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyBranding | null>(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);

  // Load companies
  useEffect(() => {
    const loadSettings = async () => {
      setLoadingData(true);
      try {
        const companiesRes = await fetch('/api/settings/companies');
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData || []);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadSettings();
  }, []);

  const handleSaveCompany = async (company: CompanyBranding) => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch('/api/settings/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(company),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save company');
      }

      const savedCompany = await response.json();
      
      // Update local state
      if (company.id) {
        setCompanies(companies.map(c => c.id === company.id ? savedCompany : c));
      } else {
        setCompanies([...companies, savedCompany]);
      }

      setSelectedCompany(null);
      setIsAddingCompany(false);
      setSuccess('Company branding saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save company');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!confirm('Are you sure you want to delete this company branding?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/settings/companies/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete company');
      }

      setCompanies(companies.filter(c => c.id !== id));
      setSuccess('Company deleted successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete company');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
              <p className="text-base text-gray-600 mt-1">
                Configure your company branding, colors, and content
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Company Branding</h2>
                <p className="text-sm text-gray-600">
                  Manage branding for each company that uses the quote system.
                </p>
              </div>
              {!isAddingCompany && !selectedCompany && (
                <button
                  onClick={() => {
                    setIsAddingCompany(true);
                    setSelectedCompany({
                      companyId: '',
                      brandCode: '',
                      companyName: '',
                      logoUrl: '',
                      primaryColor: '#c00',
                      secondaryColor: '#fff',
                      tertiaryColor: '#5a5a5a',
                      fontFamily: 'Inter',
                      heroHeading: '',
                      heroSubheading: '',
                      heroCtaText: '',
                      heroCtaUrl: '',
                      heroImageUrl: '',
                      tagline: '',
                      description: '',
                      metaDescription: '',
                    });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Company
                </button>
              )}
            </div>

            {(isAddingCompany || selectedCompany) ? (
              <CompanyForm
                company={selectedCompany}
                onSave={handleSaveCompany}
                onCancel={() => {
                  setSelectedCompany(null);
                  setIsAddingCompany(false);
                }}
                loading={loading}
              />
            ) : (
              <div className="space-y-4">
                {companies.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No companies configured yet. Click "Add Company" to get started.
                  </div>
                ) : (
                  companies.map((company) => (
                    <div
                      key={company.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {company.logoUrl && (
                            <img
                              src={company.logoUrl}
                              alt={company.companyName}
                              className="h-12 w-auto object-contain"
                            />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{company.companyName}</h3>
                            <p className="text-sm text-gray-600">
                              Company ID: {company.companyId} | Brand Code: {company.brandCode}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedCompany(company)}
                            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => company.id && handleDeleteCompany(company.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
