'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Loader2, AlertCircle, Check, LogOut, Upload, X, Image as ImageIcon, Wand2, Layout, Trash2, Search } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { LoginForm } from '@/lib/components/auth/login-form';

/** Popular Google Fonts for the company branding font selector */
const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans 3',
  'Oswald',
  'Raleway',
  'Nunito',
  'Work Sans',
  'Merriweather',
  'Playfair Display',
  'PT Sans',
  'Ubuntu',
  'Rubik',
  'DM Sans',
  'Bebas Neue',
  'Barlow',
  'Noto Sans',
  'Quicksand',
  'Karla',
  'Libre Baskerville',
  'Fira Sans',
  'Manrope',
  'Outfit',
  'Plus Jakarta Sans',
  'Arial',
  'Georgia',
  'system-ui',
];

interface CompanyBranding {
  id?: string;
  companyId: string;
  brandCode: string;
  companyName: string;
  logoUrl: string;
  heroBannerUrl?: string;
  footerImageUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  fontFamily: string;
}

/**
 * Expand shorthand hex (#RGB) to full form (#RRGGBB) for the color picker.
 * The HTML color input only accepts 7-char hex values.
 */
function expandHex(hex: string): string {
  const trimmed = hex.trim();
  // Match #RGB or #RGBA (3 or 4 chars after #)
  const match = trimmed.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (match) {
    return `#${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${match[3]}`;
  }
  // Already 6-char or invalid — return as-is (color picker will handle gracefully)
  return trimmed;
}

/**
 * Check whether a string is a valid hex color (#RGB or #RRGGBB).
 */
function isValidHex(hex: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim());
}

function ColorPickerField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  // The text input is the source of truth.
  // The color picker shows the expanded version.
  const pickerValue = isValidHex(value) ? expandHex(value) : '#000000';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          placeholder="#CC0000"
        />
      </div>
      {value && !isValidHex(value) && (
        <p className="text-xs text-amber-600 mt-1">Enter a valid hex color, e.g. #C00 or #CC0000</p>
      )}
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  description,
  previewHeight = 'h-12',
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
  previewHeight?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only PNG, JPEG, SVG, and WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File must be less than 5 MB.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/companies/upload', {
        method: 'POST',
        headers: {
          'X-Tenant-Id': 'default',
          Authorization: 'Bearer placeholder-token',
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Upload failed');
      }

      onChange(result.url || result.path);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {description && <p className="text-xs text-gray-500 mb-2">{description}</p>}

      {/* Preview */}
      {value && (
        <div className="mb-3 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <img
            src={value}
            alt={label}
            className={`${previewHeight} w-auto max-w-[200px] object-contain`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <span className="flex-1 text-sm text-gray-500 truncate">{value}</span>
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            title={`Remove ${label.toLowerCase()}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload area */}
      <div
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          uploading
            ? 'border-gray-300 bg-gray-50 cursor-wait'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              {value ? <ImageIcon className="w-5 h-5 text-gray-500" /> : <Upload className="w-5 h-5 text-gray-400" />}
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span> {label.toLowerCase()}
            </p>
            <p className="text-xs text-gray-400">PNG, JPEG, SVG, or WebP (max 5 MB)</p>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-xs text-red-600 mt-2">{uploadError}</p>
      )}
    </div>
  );
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
      heroBannerUrl: '',
      footerImageUrl: '',
      primaryColor: '#cc0000',
      secondaryColor: '#ffffff',
      tertiaryColor: '#5a5a5a',
      fontFamily: 'Inter',
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

        {/* Logo Upload */}
        <ImageUploadField
          label="Company Logo"
          value={formData.logoUrl}
          onChange={(url) => setFormData({ ...formData, logoUrl: url })}
        />

        {/* Hero Banner Upload */}
        <ImageUploadField
          label="Hero Banner Image"
          description="Optional banner image for the quote page header (recommended: 1920x400px)"
          value={formData.heroBannerUrl || ''}
          onChange={(url) => setFormData({ ...formData, heroBannerUrl: url })}
          previewHeight="h-20"
        />

        {/* Footer Image Upload */}
        <ImageUploadField
          label="Footer Image"
          description="Optional image for the quote page footer"
          value={formData.footerImageUrl || ''}
          onChange={(url) => setFormData({ ...formData, footerImageUrl: url })}
          previewHeight="h-16"
        />

        {/* Colors */}
        <div className="grid grid-cols-3 gap-4">
          <ColorPickerField
            label="Primary Color"
            value={formData.primaryColor}
            onChange={(val) => setFormData({ ...formData, primaryColor: val })}
          />
          <ColorPickerField
            label="Secondary Color"
            value={formData.secondaryColor}
            onChange={(val) => setFormData({ ...formData, secondaryColor: val })}
          />
          <ColorPickerField
            label="Tertiary Color"
            value={formData.tertiaryColor}
            onChange={(val) => setFormData({ ...formData, tertiaryColor: val })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Family
          </label>
          <select
            value={formData.fontFamily}
            onChange={(e) => setFormData({ ...formData, fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {GOOGLE_FONTS.map((font) => (
              <option key={font} value={font}>
                {font}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Used on custom and default quote pages for this company.</p>
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
  const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Companies state
  const [companies, setCompanies] = useState<CompanyBranding[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyBranding | null>(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  // Custom layouts state
  const [customLayouts, setCustomLayouts] = useState<Record<string, { isActive: boolean; version: number }>>({});

  // Load companies
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingData(false);
      return;
    }

    const loadSettings = async () => {
      setLoadingData(true);
      try {
        const companiesRes = await fetch('/api/settings/companies');
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData || []);

          // Check for custom layouts for each company
          const layouts: Record<string, { isActive: boolean; version: number }> = {};
          const companyList = companiesData || [];
          for (const c of companyList) {
            if (c.id) {
              try {
                const layoutRes = await fetch(`/api/layouts/${c.id}`);
                if (layoutRes.ok) {
                  const layoutData = await layoutRes.json();
                  if (layoutData.success && layoutData.data) {
                    layouts[c.id] = {
                      isActive: layoutData.data.isActive,
                      version: layoutData.data.version,
                    };
                  }
                }
              } catch {
                // No layout for this company — that's fine
              }
            }
          }
          setCustomLayouts(layouts);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoadingData(false);
      }
    };

    loadSettings();
  }, [isAuthenticated]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

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
        const msg = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || 'Failed to save company';
        throw new Error(msg);
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Company Settings</h1>
                <p className="text-base text-gray-600 mt-1">
                  Configure your company branding, colors, and logo
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                Signed in as <span className="font-medium text-gray-900">{user?.name || user?.username}</span>
              </span>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
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

        {/* Company Branding Section */}
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
                      heroBannerUrl: '',
                      footerImageUrl: '',
                      primaryColor: '#cc0000',
                      secondaryColor: '#ffffff',
                      tertiaryColor: '#5a5a5a',
                      fontFamily: 'Inter',
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
                {companies.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by company name, ID, or brand code..."
                      value={companySearch}
                      onChange={(e) => setCompanySearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {companySearch && (
                      <button
                        onClick={() => setCompanySearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                {(() => {
                  const filteredCompanies = companies.filter((company) => {
                    if (!companySearch.trim()) return true;
                    const q = companySearch.toLowerCase().trim();
                    return (
                      company.companyName.toLowerCase().includes(q) ||
                      company.companyId.toLowerCase().includes(q) ||
                      company.brandCode.toLowerCase().includes(q)
                    );
                  });

                  if (companies.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        No companies configured yet. Click &quot;Add Company&quot; to get started.
                      </div>
                    );
                  }

                  if (filteredCompanies.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500 text-sm">
                        No companies match &quot;{companySearch.trim()}&quot;
                      </div>
                    );
                  }

                  return filteredCompanies.map((company) => (
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
                          <div className="flex items-center gap-2 ml-4">
                            <div
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: isValidHex(company.primaryColor) ? expandHex(company.primaryColor) : company.primaryColor }}
                              title={`Primary: ${company.primaryColor}`}
                            />
                            <div
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: isValidHex(company.secondaryColor) ? expandHex(company.secondaryColor) : company.secondaryColor }}
                              title={`Secondary: ${company.secondaryColor}`}
                            />
                            <div
                              className="w-6 h-6 rounded-full border border-gray-300"
                              style={{ backgroundColor: isValidHex(company.tertiaryColor) ? expandHex(company.tertiaryColor) : company.tertiaryColor }}
                              title={`Tertiary: ${company.tertiaryColor}`}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a
                            href={`/settings/layout-builder?companyId=${company.id}`}
                            className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors flex items-center gap-1"
                          >
                            <Wand2 className="w-3 h-3" />
                            {company.id && customLayouts[company.id] ? 'Edit Layout' : 'Create Layout'}
                          </a>
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
                  ));
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Custom Layouts Section — only shown when at least one company has a custom layout */}
        {Object.keys(customLayouts).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6 mt-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Layout className="w-5 h-5 text-blue-600" />
                Custom Quote Layouts
              </h2>
              <p className="text-sm text-gray-600">
                Companies with AI-generated custom quote page layouts.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {companies
              .filter((company) => company.id && customLayouts[company.id])
              .map((company) => {
                const layout = customLayouts[company.id!];
                return (
                  <div
                    key={`layout-${company.id}`}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: layout.isActive ? '#dcfce7' : '#fef3c7',
                        }}
                      >
                        <Wand2
                          className="w-4 h-4"
                          style={{
                            color: layout.isActive ? '#16a34a' : '#d97706',
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{company.companyName}</h3>
                        <p className="text-xs text-gray-500">
                          Custom layout v{layout.version} — {layout.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (!company.id) return;
                          if (!confirm('Delete this custom layout? The company will revert to the base layout.')) return;
                          try {
                            const res = await fetch(`/api/layouts/${company.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              setCustomLayouts((prev) => {
                                const next = { ...prev };
                                delete next[company.id!];
                                return next;
                              });
                              setSuccess('Custom layout deleted.');
                            }
                          } catch {
                            setError('Failed to delete layout.');
                          }
                        }}
                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                        Delete
                      </button>
                      <a
                        href={`/settings/layout-builder?companyId=${company.id}`}
                        className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        Edit Layout
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        )}
      </main>
    </div>
  );
}
