'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Loader2, AlertCircle, Check, LogOut, Upload, X, Image as ImageIcon, Wand2, Layout, Trash2, Search, Copy, Tag, ChevronDown, Users } from 'lucide-react';
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
  layoutTemplateId?: string | null;
}

interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  version: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  brandingSettings?: Array<{ company: { id: string; name: string; tenantId: string } }>;
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
  layoutTemplates,
}: {
  company: CompanyBranding | null;
  onSave: (company: CompanyBranding) => void;
  onCancel: () => void;
  loading: boolean;
  layoutTemplates: LayoutTemplate[];
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
      layoutTemplateId: null,
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

        {/* Quote Layout Template */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
            <Layout className="w-4 h-4 text-blue-500" />
            Quote Layout Template
          </label>
          <select
            value={formData.layoutTemplateId || ''}
            onChange={(e) => setFormData({ ...formData, layoutTemplateId: e.target.value || null })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">(No template — use default or company-specific layout)</option>
            {layoutTemplates.filter(t => t.isActive).map((t) => (
              <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
            ))}
          </select>
          {formData.layoutTemplateId && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              This company will use the selected template for their quote page layout.
              Per-company images (hero banner, footer) still apply on top.
            </p>
          )}
          {!formData.layoutTemplateId && formData.id && (
            <p className="text-xs text-gray-500 mt-1">
              No template assigned. The company uses their own custom layout (if any) or the system default.
              Go to <a href={`/settings/layout-builder?companyId=${formData.id}`} className="text-blue-600 underline">Layout Builder</a> to create one.
            </p>
          )}
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

  // Tab state
  const [activeTab, setActiveTab] = useState<'companies' | 'layouts'>('companies');

  // Companies state
  const [companies, setCompanies] = useState<CompanyBranding[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyBranding | null>(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [companySearch, setCompanySearch] = useState('');

  // Custom layouts state (per-company)
  const [customLayouts, setCustomLayouts] = useState<Record<string, { isActive: boolean; version: number; source?: string }>>({});

  // Layout templates state
  const [layoutTemplates, setLayoutTemplates] = useState<LayoutTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [promoteCompanyId, setPromoteCompanyId] = useState('');
  const [promotingTemplate, setPromotingTemplate] = useState(false);

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

  // Load layout templates
  const loadLayoutTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await fetch('/api/layout-templates');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setLayoutTemplates(data.data || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadLayoutTemplates();
  }, [isAuthenticated]);

  const handlePromoteToTemplate = async () => {
    if (!newTemplateName.trim() || !promoteCompanyId) return;
    setPromotingTemplate(true);
    try {
      const res = await fetch('/api/layout-templates/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: promoteCompanyId, name: newTemplateName, description: newTemplateDesc }),
      });
      const data = await res.json();
      if (data.success) {
        setLayoutTemplates((prev) => [data.data, ...prev]);
        setNewTemplateName('');
        setNewTemplateDesc('');
        setPromoteCompanyId('');
        setCreatingTemplate(false);
        setSuccess(`Template "${data.data.name}" created!`);
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to create template');
      }
    } catch {
      setError('Failed to create template');
    } finally {
      setPromotingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Delete template "${name}"? All companies using this template will revert to their individual layouts.`)) return;
    try {
      const res = await fetch(`/api/layout-templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLayoutTemplates((prev) => prev.filter((t) => t.id !== id));
        setSuccess('Template deleted.');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to delete template');
      }
    } catch {
      setError('Failed to delete template');
    }
  };

  const handleAssignTemplate = async (templateId: string, companyId: string, unassign = false) => {
    try {
      const res = await fetch(`/api/layout-templates/${templateId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, unassign }),
      });
      const data = await res.json();
      if (data.success) {
        await loadLayoutTemplates();
        setSuccess(unassign ? 'Template unassigned.' : 'Template assigned!');
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(data.error || 'Failed to assign template');
      }
    } catch {
      setError('Failed to assign template');
    }
  };

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
        headers: { 'Content-Type': 'application/json' },
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

      // Also handle template assignment/unassignment
      if (savedCompany.id && company.layoutTemplateId !== undefined) {
        if (company.layoutTemplateId) {
          // Assign selected template
          await fetch(`/api/layout-templates/${company.layoutTemplateId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ companyId: savedCompany.id }),
          }).catch(() => {/* gracefully ignore if table not yet migrated */});
        } else {
          // Unassign any existing template — find which one to unassign
          const currentTemplate = layoutTemplates.find((t) =>
            t.brandingSettings?.some((bs) => bs.company.id === savedCompany.id)
          );
          if (currentTemplate) {
            await fetch(`/api/layout-templates/${currentTemplate.id}/assign`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ companyId: savedCompany.id, unassign: true }),
            }).catch(() => {});
          }
        }
        await loadLayoutTemplates();
      }

      // Update local state
      if (company.id) {
        setCompanies(companies.map(c => c.id === company.id ? { ...savedCompany, layoutTemplateId: company.layoutTemplateId } : c));
      } else {
        setCompanies([...companies, { ...savedCompany, layoutTemplateId: company.layoutTemplateId }]);
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

      {/* Tab Bar */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-1" aria-label="Tabs">
            {[
              { id: 'companies', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
              { id: 'layouts', label: 'Custom Layouts', icon: <Layout className="w-4 h-4" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'companies' | 'layouts')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'layouts' && layoutTemplates.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                    {layoutTemplates.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

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

        {/* ── COMPANIES TAB ── */}
        {activeTab === 'companies' && (
        <>
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
                layoutTemplates={layoutTemplates}
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

        {/* Per-company layouts section */}
        {Object.keys(customLayouts).length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 space-y-4 mt-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-600" />
                Company-Specific Layouts
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Companies that have their own custom quote page layouts.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {companies
              .filter((company) => company.id && customLayouts[company.id])
              .map((company) => {
                const layout = customLayouts[company.id!];
                const assignedTemplate = layoutTemplates.find((t) =>
                  t.brandingSettings?.some((bs) => bs.company.id === company.id)
                );
                return (
                  <div key={`layout-${company.id}`} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: layout.isActive ? '#dcfce7' : '#fef3c7' }}>
                        <Wand2 className="w-4 h-4" style={{ color: layout.isActive ? '#16a34a' : '#d97706' }} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{company.companyName}</h3>
                        <p className="text-xs text-gray-500">
                          {assignedTemplate
                            ? <>Using template: <span className="font-medium text-blue-600">{assignedTemplate.name}</span></>
                            : `Custom layout v${layout.version} — ${layout.isActive ? 'Active' : 'Inactive'}`
                          }
                          {layout.source === 'static_fallback' && ' (static fallback)'}
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
                              setCustomLayouts((prev) => { const next = { ...prev }; delete next[company.id!]; return next; });
                              setSuccess('Custom layout deleted.');
                            }
                          } catch { setError('Failed to delete layout.'); }
                        }}
                        className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete
                      </button>
                      <a href={`/settings/layout-builder?companyId=${company.id}`} className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5">
                        <Wand2 className="w-3.5 h-3.5" />Edit Layout
                      </a>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
        )}
        </> /* end COMPANIES TAB */
        )}

        {/* ── LAYOUT TEMPLATES TAB ── */}
        {activeTab === 'layouts' && (
        <div className="space-y-6">
          {/* Header + create button */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-blue-600" />
                  Layout Templates
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Named, reusable quote page layouts. Assign a template to multiple companies. Each company keeps their own images (hero banner, footer) on top.
                </p>
              </div>
              <button
                onClick={() => setCreatingTemplate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Create Template
              </button>
            </div>

            {/* Create template form */}
            {creatingTemplate && (
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4 mb-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">New Layout Template</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. Grace Standard, Crown Premium..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Description (optional)</label>
                  <input
                    type="text"
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    placeholder="Brief description of this layout..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Create from company layout <span className="text-gray-400">(source)</span></label>
                  <select
                    value={promoteCompanyId}
                    onChange={(e) => setPromoteCompanyId(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select a company to use as source —</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.companyName} ({c.companyId})</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">The company&apos;s existing layout config will be copied into this template.</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePromoteToTemplate}
                    disabled={!newTemplateName.trim() || !promoteCompanyId || promotingTemplate}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {promotingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    {promotingTemplate ? 'Creating...' : 'Create Template'}
                  </button>
                  <button onClick={() => { setCreatingTemplate(false); setNewTemplateName(''); setNewTemplateDesc(''); setPromoteCompanyId(''); }} className="px-4 py-2 text-gray-600 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Search */}
            {layoutTemplates.length > 0 && (
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Template list */}
            {loadingTemplates ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
            ) : layoutTemplates.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Layout className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No layout templates yet</p>
                <p className="text-sm mt-1">Create a template from an existing company layout to share it across multiple companies.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {layoutTemplates
                  .filter((t) => !templateSearch.trim() || t.name.toLowerCase().includes(templateSearch.toLowerCase()))
                  .map((template) => {
                    const assignedCompanies = template.brandingSettings?.map((bs) => bs.company) || [];
                    return (
                      <div key={template.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${template.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Layout className={`w-4 h-4 ${template.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                                <span className="text-xs text-gray-400 flex-shrink-0">v{template.version}</span>
                                {!template.isActive && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Inactive</span>}
                              </div>
                              {template.description && <p className="text-xs text-gray-500 truncate">{template.description}</p>}
                              <div className="flex items-center gap-1 mt-1">
                                <Users className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-400">
                                  {assignedCompanies.length === 0
                                    ? 'Not assigned to any company'
                                    : assignedCompanies.map((c) => c.name).join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <a
                              href={`/settings/layout-builder?templateId=${template.id}`}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                            >
                              <Wand2 className="w-3.5 h-3.5" />Edit
                            </a>
                            <button
                              onClick={() => handleDeleteTemplate(template.id, template.name)}
                              className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />Delete
                            </button>
                          </div>
                        </div>

                        {/* Assign to company */}
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center gap-3">
                          <span className="text-xs text-gray-500 font-medium flex-shrink-0">Assign to:</span>
                          <select
                            defaultValue=""
                            onChange={async (e) => {
                              if (!e.target.value) return;
                              await handleAssignTemplate(template.id, e.target.value);
                              e.target.value = '';
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white focus:ring-1 focus:ring-blue-500 flex-1 max-w-xs"
                          >
                            <option value="">— select company —</option>
                            {companies
                              .filter((c) => !assignedCompanies.some((ac) => ac.id === c.id))
                              .map((c) => (
                                <option key={c.id} value={c.id}>{c.companyName}</option>
                              ))}
                          </select>
                          {assignedCompanies.map((ac) => (
                            <div key={ac.id} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                              {ac.name}
                              <button
                                onClick={() => handleAssignTemplate(template.id, ac.id, true)}
                                className="ml-1 hover:text-red-600"
                                title="Unassign"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
        )} {/* end LAYOUT TEMPLATES TAB */}

      </main>
    </div>
  );
}
