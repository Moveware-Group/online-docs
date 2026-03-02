'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Loader2, AlertCircle, Check, LogOut, Upload, X, Image as ImageIcon, Wand2, Layout, Trash2, Search, Copy, Tag, ChevronDown, ChevronRight, Users, Pencil, Code2, Save as SaveIcon, HelpCircle, RefreshCw, FileText, Star, CreditCard, FolderOpen, Shield } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { LoginForm } from '@/lib/components/auth/login-form';
import { PLACEHOLDER_REGISTRY, PLACEHOLDER_CATEGORIES, type PlaceholderCategory } from '@/lib/data/placeholder-registry';
import { GRACE_STATIC_LAYOUT } from '@/lib/layouts/grace-static';
import { DEFAULT_STATIC_LAYOUT } from '@/lib/layouts/default-static';
import { DOC_TYPES, DOC_TYPE_COLORS, type DocTypeId } from '@/lib/data/doc-types';

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
  /** Legacy: quote layout template ID from BrandingSettings */
  layoutTemplateId?: string | null;
  /** Per-docType layout assignments: { quote: { templateId, templateName }, review: {...}, ... } */
  docTypeLayouts?: Record<string, { templateId: string; templateName: string }>;
  /** Moveware REST API username (read/write) */
  mwUsername?: string;
  /** True when a password is already stored — password itself is never returned from the API */
  mwPasswordSet?: boolean;
  /** Write-only: a new password entered by the user. Empty = keep existing. */
  mwPassword?: string;
  /** Unit used to display inventory weights on the quote page */
  inventoryWeightUnit?: 'kg' | 'lbs';
  /** Footer background colour */
  footerBgColor?: string;
  /** Footer text colour */
  footerTextColor?: string;
  footerAddressLine1?: string;
  footerAddressLine2?: string;
  footerPhone?: string;
  footerEmail?: string;
  footerAbn?: string;
}

interface RoleRecord {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount?: number;
}

interface UserRecord {
  id: string;
  username: string;
  email: string | null;
  name: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
  companies: { id: string; name: string; tenantId: string }[];
}

interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  version: number;
  isActive: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
  brandingSettings?: Array<{ company: { id: string; name: string; tenantId: string } }>;
}

interface LayoutSection {
  id: string;
  label?: string;
  type: string;
  html?: string;
  visible?: boolean;
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
      mwUsername: '',
      mwPasswordSet: false,
      mwPassword: '',
      inventoryWeightUnit: 'kg',
      footerBgColor: '#ffffff',
      footerTextColor: '#374151',
      footerAddressLine1: '',
      footerAddressLine2: '',
      footerPhone: '',
      footerEmail: '',
      footerAbn: '',
    }
  );
  const [showMwPassword, setShowMwPassword] = useState(false);

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

        {/* Quote Layout — status + optional template override */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <Layout className="w-4 h-4 text-blue-500" />
            Quote Page Layout
          </p>

          {/* Layout Builder link */}
          {formData.id ? (
            <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${formData.layoutTemplateId ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2">
                {formData.layoutTemplateId ? (
                  <>
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Layout template assigned</p>
                      <p className="text-xs text-green-600">This company has a layout template assigned.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">No layout template assigned</p>
                      <p className="text-xs text-gray-500">Using the system default layout.</p>
                    </div>
                  </>
                )}
              </div>
              <a
                href={
                  formData.layoutTemplateId
                    ? `/settings/layout-builder?templateId=${formData.layoutTemplateId}`
                    : `/settings/layout-builder?companyId=${formData.id}`
                }
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors flex-shrink-0"
              >
                <Wand2 className="w-3 h-3" />
                {formData.layoutTemplateId ? 'Edit Layout' : 'Create Layout'}
              </a>
            </div>
          ) : (
            <p className="text-xs text-gray-500">Save this company first, then create a layout in the Layout Builder.</p>
          )}

          {/* Part 2: Optional shared template override */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Apply shared template <span className="font-normal text-gray-400">(optional — overrides company layout)</span>
            </label>
            <select
              value={formData.layoutTemplateId || ''}
              onChange={(e) => setFormData({ ...formData, layoutTemplateId: e.target.value || null })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">— Use company&apos;s own layout (no shared template) —</option>
              {layoutTemplates.filter(t => t.isActive).map((t) => (
                <option key={t.id} value={t.id}>{t.name} (v{t.version})</option>
              ))}
            </select>
            {layoutTemplates.filter(t => t.isActive).length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                No shared templates yet. Create one in the <button type="button" onClick={() => {}} className="text-blue-500 underline">Custom Layouts</button> tab.
              </p>
            )}
            {formData.layoutTemplateId && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                Shared template will take priority over the company&apos;s own layout. Per-company images still apply.
              </p>
            )}
          </div>
        </div>

        {/* Quote Settings */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Quote Settings
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Measurement System
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, inventoryWeightUnit: 'kg' })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  (formData.inventoryWeightUnit ?? 'kg') !== 'lbs'
                    ? 'text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                style={
                  (formData.inventoryWeightUnit ?? 'kg') !== 'lbs'
                    ? { backgroundColor: formData.primaryColor || '#cc0000' }
                    : {}
                }
              >
                Metric (kg, m³)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, inventoryWeightUnit: 'lbs' })}
                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                  formData.inventoryWeightUnit === 'lbs'
                    ? 'text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
                style={
                  formData.inventoryWeightUnit === 'lbs'
                    ? { backgroundColor: formData.primaryColor || '#cc0000' }
                    : {}
                }
              >
                Imperial (lbs, ft³)
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Controls how weight and volume are displayed in the inventory table on the quote page.
            </p>
          </div>
        </div>

        {/* Footer Settings */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Footer
          </p>

          {/* Background + text colour */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Background Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.footerBgColor || '#ffffff'}
                  onChange={(e) => setFormData({ ...formData, footerBgColor: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.footerBgColor || '#ffffff'}
                  onChange={(e) => setFormData({ ...formData, footerBgColor: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg font-mono"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Text Colour</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.footerTextColor || '#374151'}
                  onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={formData.footerTextColor || '#374151'}
                  onChange={(e) => setFormData({ ...formData, footerTextColor: e.target.value })}
                  className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-lg font-mono"
                  placeholder="#374151"
                />
              </div>
            </div>
          </div>

          {/* Contact details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 1</label>
              <input
                type="text"
                value={formData.footerAddressLine1 || ''}
                onChange={(e) => setFormData({ ...formData, footerAddressLine1: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="11 Toohey Street"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address Line 2</label>
              <input
                type="text"
                value={formData.footerAddressLine2 || ''}
                onChange={(e) => setFormData({ ...formData, footerAddressLine2: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brisbane QLD 4000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="text"
                value={formData.footerPhone || ''}
                onChange={(e) => setFormData({ ...formData, footerPhone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+61 7 3000 0000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={formData.footerEmail || ''}
                onChange={(e) => setFormData({ ...formData, footerEmail: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="info@company.com.au"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ABN</label>
              <input
                type="text"
                value={formData.footerAbn || ''}
                onChange={(e) => setFormData({ ...formData, footerAbn: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="12 345 678 901"
              />
            </div>
          </div>
        </div>

        {/* Moveware API Credentials */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Moveware API Credentials
          </p>
          <p className="text-xs text-gray-500">
            Used to fetch live job data from the Moveware REST API. The password is stored securely and never returned to the browser.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                API Username
              </label>
              <input
                type="text"
                value={formData.mwUsername || ''}
                onChange={(e) => setFormData({ ...formData, mwUsername: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tony.kent@moveconnect.com"
                autoComplete="off"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                API Password
                {formData.mwPasswordSet && !formData.mwPassword && (
                  <span className="ml-1.5 text-green-600 font-normal">● saved</span>
                )}
              </label>
              <div className="relative">
                <input
                  type={showMwPassword ? 'text' : 'password'}
                  value={formData.mwPassword || ''}
                  onChange={(e) => setFormData({ ...formData, mwPassword: e.target.value })}
                  className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={formData.mwPasswordSet ? '(leave blank to keep current)' : 'Enter password'}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowMwPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showMwPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {(formData.mwUsername || formData.mwPasswordSet) && (
            <p className="text-xs text-blue-600 flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Live Moveware API calls are enabled for company ID {formData.companyId || '…'}.
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

// ---------------------------------------------------------------------------
// Template section block editor (fetches sections on first open, then edits inline)
// ---------------------------------------------------------------------------
function TemplateSectionBlockEditor({
  templateId,
  editingBlockKey,
  editingBlockHtml,
  savingBlock,
  blockEditorExpandedCats,
  onOpenBlock,
  onCloseBlock,
  onChangeHtml,
  onSaveBlock,
  onToggleCat,
  onInsertPlaceholder,
  textareaRef,
}: {
  templateId: string;
  editingBlockKey: string | null;
  editingBlockHtml: string;
  savingBlock: boolean;
  blockEditorExpandedCats: Set<PlaceholderCategory>;
  onOpenBlock: (id: string, idx: number, html: string) => void;
  onCloseBlock: () => void;
  onChangeHtml: (v: string) => void;
  onSaveBlock: (templateId: string, idx: number) => void;
  onToggleCat: (c: PlaceholderCategory) => void;
  onInsertPlaceholder: (key: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/layout-templates/${templateId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data?.layoutConfig) {
          const cfg = typeof d.data.layoutConfig === 'string'
            ? JSON.parse(d.data.layoutConfig)
            : d.data.layoutConfig;
          setSections(cfg.sections || []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [templateId]);

  if (loading) return <div className="px-4 py-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>;

  return (
    <div className="bg-gray-50 px-4 pb-4 pt-2 space-y-2">
      <p className="text-xs text-gray-500 mb-2">Click <Pencil className="w-3 h-3 inline" /> to edit a block&apos;s HTML</p>
      {sections.map((section, idx) => {
        const blockKey = `${templateId}:${idx}`;
        const isEditing = editingBlockKey === blockKey;
        const label = section.label || section.id || `Block ${idx + 1}`;
        return (
          <div key={section.id || idx}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-white ${isEditing ? 'border-blue-400' : 'border-gray-200'}`}>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-800 block truncate">{label}</span>
                <span className="text-xs text-gray-400">{section.type === 'custom_html' ? 'HTML' : section.type}</span>
              </div>
              <span className="text-xs text-gray-400 font-mono w-5 text-center">{idx + 1}</span>
              {section.type === 'custom_html' && (
                <button
                  onClick={() => isEditing ? onCloseBlock() : onOpenBlock(templateId, idx, section.html || '')}
                  className={`p-1.5 rounded transition-colors ${isEditing ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {isEditing && (
              <BlockHtmlEditor
                html={editingBlockHtml}
                onChange={onChangeHtml}
                onSave={() => onSaveBlock(templateId, idx)}
                onCancel={onCloseBlock}
                saving={savingBlock}
                textareaRef={textareaRef}
                expandedCats={blockEditorExpandedCats}
                onToggleCat={onToggleCat}
                onInsertPlaceholder={onInsertPlaceholder}
              />
            )}
          </div>
        );
      })}
      {sections.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No blocks found.</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline block HTML editor panel (used inside the Custom Layouts tab)
// ---------------------------------------------------------------------------
function BlockHtmlEditor({
  html,
  onChange,
  onSave,
  onCancel,
  saving,
  textareaRef,
  expandedCats,
  onToggleCat,
  onInsertPlaceholder,
}: {
  html: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  expandedCats: Set<PlaceholderCategory>;
  onToggleCat: (c: PlaceholderCategory) => void;
  onInsertPlaceholder: (key: string) => void;
}) {
  return (
    <div className="border border-blue-300 rounded-lg overflow-hidden bg-white shadow-sm mt-2">
      <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-200">
        <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5" />
          Edit Block HTML
        </span>
        <p className="text-xs text-blue-600">Click a placeholder to insert it at your cursor</p>
      </div>
      <div className="flex" style={{ height: '360px' }}>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={html}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-3 font-mono text-xs text-gray-800 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 border-r border-gray-200"
          spellCheck={false}
        />
        {/* Placeholder picker */}
        <div className="w-52 flex-shrink-0 overflow-y-auto bg-gray-50">
          <div className="px-3 py-2 border-b border-gray-200 sticky top-0 bg-gray-50">
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Placeholders</p>
          </div>
          {PLACEHOLDER_CATEGORIES.map((category) => {
            const items = PLACEHOLDER_REGISTRY.filter((p) => p.category === category);
            const isExp = expandedCats.has(category);
            return (
              <div key={category} className="border-b border-gray-100">
                <button
                  onClick={() => onToggleCat(category)}
                  className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 transition-colors text-left"
                >
                  <span className="text-[10px] font-semibold text-gray-600 uppercase">{category}</span>
                  {isExp ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                </button>
                {isExp && items.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => onInsertPlaceholder(p.key)}
                    title={p.description || p.label}
                    className="w-full text-left px-3 py-1.5 hover:bg-blue-50 transition-colors border-t border-gray-50"
                  >
                    <div className="text-[10px] font-mono text-blue-700 truncate">{`{{${p.key}}}`}</div>
                    <div className="text-[10px] text-gray-400 truncate">{p.label}</div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save Block'}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { isAuthenticated, isLoading: authLoading, user, logout, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<'companies' | 'layouts' | 'users' | 'roles'>('companies');

  // Companies state
  const [companies, setCompanies] = useState<CompanyBranding[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<CompanyBranding | null>(null);
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  // Track which company rows have their Layouts section expanded
  const [expandedLayoutsFor, setExpandedLayoutsFor] = useState<Set<string>>(new Set());

  // ── Users & Roles state ────────────────────────────────────────────────────
  const [roles, setRoles] = useState<RoleRecord[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);

  const toggleLayoutsExpanded = (companyId: string) => {
    setExpandedLayoutsFor((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) next.delete(companyId); else next.add(companyId);
      return next;
    });
  };

  // Layout templates state
  const [layoutTemplates, setLayoutTemplates] = useState<LayoutTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');

  const [promotingTemplate, setPromotingTemplate] = useState(false);
  const [createFromBase, setCreateFromBase] = useState<'grace' | 'default' | 'blank' | 'html' | 'duplicate'>('default');
  const [importHtml, setImportHtml] = useState('');
  const [duplicateSourceTemplateId, setDuplicateSourceTemplateId] = useState('');
  const [settingDefaultTemplateId, setSettingDefaultTemplateId] = useState<string | null>(null);
  const [createAsGlobalDefault, setCreateAsGlobalDefault] = useState(false);

  // Template company-assignment multi-select dropdown
  const [assignDropdownOpen, setAssignDropdownOpen] = useState<string | null>(null); // templateId
  const [assignSearch, setAssignSearch] = useState('');
  const [assignPending, setAssignPending] = useState<Set<string>>(new Set()); // companyIds pending
  const [assigningSaving, setAssigningSaving] = useState(false);
  const assignDropdownRef = useRef<HTMLDivElement>(null);

  // Inline template rename
  const [renamingTemplateId, setRenamingTemplateId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameSaving, setRenameSaving] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Block editor state — shared between the Layout Templates section
  const [expandedLayouts, setExpandedLayouts] = useState<Set<string>>(new Set());
  const [editingBlockKey, setEditingBlockKey] = useState<string | null>(null);
  const [editingBlockHtml, setEditingBlockHtml] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);
  const [blockEditorExpandedCats, setBlockEditorExpandedCats] = useState<Set<PlaceholderCategory>>(
    new Set(['Customer', 'Job', 'Branding', 'Dates'])
  );
  const blockEditorTextareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleLayoutExpanded = (id: string) => {
    setExpandedLayouts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else next.add(id);
      return next;
    });
    if (editingBlockKey?.startsWith(id)) {
      setEditingBlockKey(null);
    }
  };

  const openBlockEditor = (layoutId: string, blockIdx: number, currentHtml: string) => {
    setEditingBlockKey(`${layoutId}:${blockIdx}`);
    setEditingBlockHtml(currentHtml);
    setTimeout(() => blockEditorTextareaRef.current?.focus(), 50);
  };

  const closeBlockEditor = () => {
    setEditingBlockKey(null);
    setEditingBlockHtml('');
  };

  const insertPlaceholderInBlockEditor = (key: string) => {
    const ta = blockEditorTextareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? editingBlockHtml.length;
    const end = ta.selectionEnd ?? start;
    const token = `{{${key}}}`;
    const newHtml = editingBlockHtml.slice(0, start) + token + editingBlockHtml.slice(end);
    setEditingBlockHtml(newHtml);
    setTimeout(() => {
      ta.focus();
      const pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target as Node)) {
        setAssignDropdownOpen(null);
        setAssignSearch('');
        setAssignPending(new Set());
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Load companies
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingData(false);
      return;
    }

    const loadSettings = async () => {
      setLoadingData(true);
      try {
        const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const companiesRes = await fetch('/api/settings/companies', { headers: authHeaders });
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

  // ── Users / Roles load functions ─────────────────────────────────────────
  const authHeader: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/settings/users', { headers: authHeader });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setUsers(data.data || []);
      }
    } catch { /* ignore */ } finally { setLoadingUsers(false); }
  };

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const res = await fetch('/api/settings/roles', { headers: authHeader });
      const data = await res.json();
      if (data.success) {
        setRoles(data.data || []);
      } else {
        setError(`Roles API error (${res.status}): ${data.error || 'Unknown error'}`);
      }
    } catch (e) {
      setError(`Failed to load roles: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Save block HTML changes back to a shared template
  const saveTemplateBlock = async (templateId: string, blockIdx: number) => {
    const template = layoutTemplates.find((t) => t.id === templateId);
    if (!template) return;
    setSavingBlock(true);
    try {
      // We need the full layoutConfig — fetch it first
      const getRes = await fetch(`/api/layout-templates/${templateId}`);
      if (!getRes.ok) throw new Error('Failed to fetch template');
      const getData = await getRes.json();
      const currentConfig = getData.data?.layoutConfig
        ? (typeof getData.data.layoutConfig === 'string' ? JSON.parse(getData.data.layoutConfig) : getData.data.layoutConfig)
        : {};
      if (!currentConfig.sections) throw new Error('No sections found');
      const updatedSections = currentConfig.sections.map((s: LayoutSection, i: number) =>
        i === blockIdx ? { ...s, html: editingBlockHtml } : s
      );
      const updatedConfig = { ...currentConfig, sections: updatedSections };
      const putRes = await fetch(`/api/layout-templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutConfig: updatedConfig, name: template.name }),
      });
      if (putRes.ok) {
        closeBlockEditor();
        setSuccess('Block saved to template.');
        setTimeout(() => setSuccess(null), 3000);
        await loadLayoutTemplates();
      } else {
        setError('Failed to save block.');
      }
    } catch {
      setError('Failed to save block.');
    } finally {
      setSavingBlock(false);
    }
  };

  const handlePromoteToTemplate = async () => {
    if (!newTemplateName.trim()) return;
    if (createFromBase === 'duplicate' && !duplicateSourceTemplateId) return;
    setPromotingTemplate(true);
    try {
      let res: Response;
      if (createFromBase === 'grace') {
        res = await fetch('/api/layout-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTemplateName, description: newTemplateDesc, layoutConfig: GRACE_STATIC_LAYOUT, isDefault: createAsGlobalDefault }),
        });
      } else if (createFromBase === 'default') {
        res = await fetch('/api/layout-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTemplateName, description: newTemplateDesc, layoutConfig: DEFAULT_STATIC_LAYOUT, isDefault: createAsGlobalDefault }),
        });
      } else if (createFromBase === 'blank') {
        const blankConfig = {
          version: 1,
          globalStyles: { fontFamily: 'Arial, Helvetica, sans-serif', backgroundColor: '#f9fafb', maxWidth: '1152px' },
          sections: [{
            id: `custom-html-${Date.now()}`,
            label: 'Custom HTML',
            type: 'custom_html',
            visible: true,
            html: '<!-- Start building your layout here. Use {{placeholders}} for dynamic data. -->',
          }],
        };
        res = await fetch('/api/layout-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTemplateName, description: newTemplateDesc, layoutConfig: blankConfig, isDefault: createAsGlobalDefault }),
        });
      } else if (createFromBase === 'html') {
        const htmlConfig = {
          version: 1,
          globalStyles: { fontFamily: 'Arial, Helvetica, sans-serif', backgroundColor: '#f9fafb', maxWidth: '1152px' },
          sections: [{
            id: `custom-html-${Date.now()}`,
            label: 'Imported HTML',
            type: 'custom_html',
            visible: true,
            html: importHtml,
          }],
        };
        res = await fetch('/api/layout-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTemplateName, description: newTemplateDesc, layoutConfig: htmlConfig, isDefault: createAsGlobalDefault }),
        });
      } else if (createFromBase === 'duplicate') {
        const srcRes = await fetch(`/api/layout-templates/${duplicateSourceTemplateId}`);
        const srcData = await srcRes.json();
        if (!srcData.success) throw new Error('Failed to fetch source template');
        res = await fetch('/api/layout-templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newTemplateName, description: newTemplateDesc, layoutConfig: srcData.data.layoutConfig, isDefault: createAsGlobalDefault }),
        });
      } else {
        setError('Please select a base layout to create from.');
        return;
      }
      const data = await res!.json();
      if (data.success) {
        setLayoutTemplates((prev) => [data.data, ...prev]);
        setNewTemplateName('');
        setNewTemplateDesc('');
        setImportHtml('');
        setDuplicateSourceTemplateId('');
        setCreateFromBase('default');
        setCreateAsGlobalDefault(false);
        setCreatingTemplate(false);
        setSuccess(createAsGlobalDefault ? `Template "${data.data.name}" created and set as Global Default!` : `Template "${data.data.name}" created!`);
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

  /** Assign all pending companies in one go then close the dropdown */
  const handleAssignMultiple = async (templateId: string) => {
    if (assignPending.size === 0) return;
    setAssigningSaving(true);
    try {
      for (const companyId of assignPending) {
        await fetch(`/api/layout-templates/${templateId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId }),
        });
      }
      await loadLayoutTemplates();
      setSuccess(`Assigned to ${assignPending.size} compan${assignPending.size === 1 ? 'y' : 'ies'}.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to assign template to one or more companies');
    } finally {
      setAssignDropdownOpen(null);
      setAssignSearch('');
      setAssignPending(new Set());
      setAssigningSaving(false);
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
            {([
              { id: 'companies', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
              { id: 'layouts', label: 'Layout Templates', icon: <Layout className="w-4 h-4" /> },
              // Users and Roles tabs only visible to admins
              ...(user?.isAdmin ? [
                { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
                { id: 'roles', label: 'Roles', icon: <Shield className="w-4 h-4" /> },
              ] : []),
            ] as { id: string; label: string; icon: React.ReactNode }[]).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as 'companies' | 'layouts' | 'users' | 'roles');
                  if (tab.id === 'users' && users.length === 0) loadUsers();
                  if (tab.id === 'roles' && roles.length === 0) loadRoles();
                }}
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
                {tab.id === 'users' && users.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                    {users.length}
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
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {company.logoUrl && (
                            <img
                              src={company.logoUrl}
                              alt={company.companyName}
                              className="h-12 w-auto object-contain flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{company.companyName}</h3>
                            <p className="text-sm text-gray-600 truncate">
                              Company ID: {company.companyId} | Brand Code: {company.brandCode}
                            </p>
                          </div>
                        </div>
                        {/* Brand colours — exact fixed width: 3×24px circles + 2×8px gaps = 88px */}
                        <div className="flex items-center gap-2 flex-shrink-0 w-[88px]">
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
                        {/* Actions */}
                        <div className="flex gap-2 flex-shrink-0 justify-end">
                          <button
                            onClick={() => company.id && toggleLayoutsExpanded(company.id)}
                            className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors flex items-center gap-1"
                            title="Manage layouts for this company"
                          >
                            <Wand2 className="w-3 h-3" />
                            Layouts
                            {company.id && expandedLayoutsFor.has(company.id)
                              ? <ChevronDown className="w-3 h-3" />
                              : <ChevronRight className="w-3 h-3" />
                            }
                          </button>
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

                      {/* ── Per-docType Layouts expandable section ── */}
                      {company.id && expandedLayoutsFor.has(company.id) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Document Layouts</p>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {DOC_TYPES.map((dt) => {
                              const colors = DOC_TYPE_COLORS[dt.color];
                              const assignment = company.docTypeLayouts?.[dt.id];
                              const hasLayout = !!assignment;
                              const isComingSoon = dt.status === 'coming_soon';
                              const DocIcon = dt.id === 'quote' ? FileText
                                : dt.id === 'review' ? Star
                                : dt.id === 'payment' ? CreditCard
                                : FolderOpen;

                              // Build layout builder URL
                              const builderUrl = hasLayout
                                ? `/settings/layout-builder?templateId=${assignment.templateId}&docType=${dt.id}`
                                : `/settings/layout-builder?companyId=${company.id}&docType=${dt.id}`;

                              return (
                                <div
                                  key={dt.id}
                                  className={`rounded-xl border p-3 flex flex-col gap-2 ${isComingSoon ? 'opacity-50' : ''} ${colors.border} ${colors.bg}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <DocIcon className={`w-4 h-4 flex-shrink-0 ${colors.text}`} />
                                    <span className={`text-xs font-semibold ${colors.text}`}>{dt.shortLabel}</span>
                                    {isComingSoon && (
                                      <span className="ml-auto text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Soon</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 leading-tight">{dt.description}</p>
                                  {isComingSoon ? (
                                    <span className="text-xs text-gray-400 italic">Coming soon</span>
                                  ) : (
                                    <a
                                      href={builderUrl}
                                      className={`mt-auto inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${colors.text} ${colors.border} ${colors.hover} bg-white`}
                                    >
                                      <Wand2 className="w-3 h-3" />
                                      {hasLayout ? 'Edit Layout' : 'Create Layout'}
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        </div>

        </> /* end COMPANIES TAB */
        )}

        {/* ── LAYOUT TEMPLATES TAB ── */}
        {activeTab === 'layouts' && (
        <div className="space-y-6">


          {/* ── SHARED LAYOUT TEMPLATES SECTION ── */}
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

            {/* Layout resolution order info panel */}
            <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                How layouts are resolved for each company (in order)
              </p>
              <ol className="space-y-1.5 text-xs text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span><strong>Assigned Template</strong> — a specific template assigned to this company overrides everything else.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span><strong>Global Default Template</strong> — the template marked <span className="font-semibold text-green-700">🌐 Global Default</span> below applies to ALL companies with no assigned template. Edit it to change what every new client sees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Built-in default</strong> — the hard-coded standard quote layout (no customisation applied).</span>
                </li>
              </ol>
            </div>

            {/* Global Default callout — shown when no template is marked as default */}
            {!layoutTemplates.some((t) => t.isDefault) && !creatingTemplate && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-800">No Global Default template set</p>
                  <p className="text-xs text-amber-700 mt-0.5">All companies without an assigned template will fall back to the built-in hard-coded default. Create a Global Default template to control what they see.</p>
                </div>
                <button
                  onClick={() => {
                    setNewTemplateName('Default Layout');
                    setNewTemplateDesc('Global default layout used by all companies without a specific template');
                    setCreateFromBase('default');
                    setCreateAsGlobalDefault(true);
                    setCreatingTemplate(true);
                  }}
                  className="flex-shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  + Create Global Default
                </button>
              </div>
            )}

            {/* Create template form */}
            {creatingTemplate && (
              <div className={`border rounded-lg p-4 mb-4 space-y-3 ${createAsGlobalDefault ? 'border-amber-300 bg-amber-50' : 'border-blue-200 bg-blue-50'}`}>
                <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  New Layout Template
                  {createAsGlobalDefault && <span className="text-xs bg-amber-100 text-amber-700 border border-amber-300 px-2 py-0.5 rounded-full">🌐 Will be set as Global Default</span>}
                </h3>
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
                  <label className="block text-xs font-medium text-gray-700 mb-2">Layout source <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2 mb-3 sm:grid-cols-3">
                    {([
                      { key: 'blank',     label: 'Blank',              sub: 'Start from scratch',        color: 'gray'   },
                      { key: 'html',      label: 'Import HTML',         sub: 'Paste your own markup',      color: 'orange' },
                      { key: 'duplicate', label: 'Duplicate Template',  sub: 'Copy an existing template',  color: 'teal'   },
                      { key: 'default',   label: 'Default Layout',      sub: 'Built-in standard blocks',   color: 'blue'   },
                      { key: 'grace',     label: 'Grace Base Layout',   sub: 'Latest grace-static.ts',     color: 'purple' },
                    ] as const).map(({ key, label, sub, color }) => {
                      const active = createFromBase === key;
                      const colorMap: Record<string, string> = {
                        gray:   active ? 'bg-gray-100 border-gray-400 text-gray-800'   : 'border-gray-200 text-gray-500 hover:bg-gray-50',
                        orange: active ? 'bg-orange-50 border-orange-400 text-orange-700' : 'border-gray-200 text-gray-500 hover:bg-orange-50',
                        teal:   active ? 'bg-teal-50 border-teal-400 text-teal-700'    : 'border-gray-200 text-gray-500 hover:bg-teal-50',
                        blue:   active ? 'bg-blue-50 border-blue-400 text-blue-700'    : 'border-gray-200 text-gray-500 hover:bg-blue-50',
                        purple: active ? 'bg-purple-50 border-purple-400 text-purple-700' : 'border-gray-200 text-gray-500 hover:bg-purple-50',
                      };
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setCreateFromBase(key); setImportHtml(''); setDuplicateSourceTemplateId(''); }}
                          className={`px-3 py-2.5 text-left text-xs rounded-lg border transition-colors ${colorMap[color]}`}
                        >
                          <div className="font-semibold">{label}</div>
                          <div className="text-[10px] opacity-70 mt-0.5">{sub}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Blank */}
                  {createFromBase === 'blank' && (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600">
                      Creates a template with a single empty HTML block. Open it in the Layout Builder to add blocks or paste your own markup.
                    </div>
                  )}

                  {/* Import HTML */}
                  {createFromBase === 'html' && (
                    <div className="space-y-2">
                      <p className="text-xs text-orange-700 font-medium">Paste your full HTML below. It will be stored as a single custom HTML block — open the Layout Builder afterwards to split it into sections if needed.</p>
                      <textarea
                        value={importHtml}
                        onChange={(e) => setImportHtml(e.target.value)}
                        rows={10}
                        spellCheck={false}
                        placeholder="<!DOCTYPE html>&#10;<html>&#10;  <!-- paste your layout HTML here -->&#10;</html>"
                        className="w-full px-3 py-2 text-xs font-mono border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-400 bg-white resize-y"
                      />
                      <p className="text-[10px] text-gray-400">Use <code className="bg-gray-100 px-0.5 rounded">{'{{customerName}}'}</code>, <code className="bg-gray-100 px-0.5 rounded">{'{{branding.primaryColor}}'}</code> etc. for dynamic values.</p>
                    </div>
                  )}

                  {/* Duplicate */}
                  {createFromBase === 'duplicate' && (
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-600 font-medium">Source template to copy from:</label>
                      <select
                        value={duplicateSourceTemplateId}
                        onChange={(e) => setDuplicateSourceTemplateId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-teal-300 rounded-lg bg-white focus:ring-2 focus:ring-teal-400"
                      >
                        <option value="">— Select a template —</option>
                        {layoutTemplates.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}{t.isDefault ? ' (Global Default)' : ''}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500">All blocks and settings will be copied. The original template is not changed.</p>
                    </div>
                  )}

                  {/* Default */}
                  {createFromBase === 'default' && (
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      Creates the template from the standard built-in quote layout (Header, Intro, Locations, Pricing, Inventory, Accept Quote). The same layout all companies use before any customisation is applied.
                    </div>
                  )}

                  {/* Grace */}
                  {createFromBase === 'grace' && (
                    <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
                      Creates the template from the current built-in Grace base layout (<code>grace-static.ts</code>). Use this to seed a fresh, up-to-date Grace layout that you can then assign to companies.
                    </div>
                  )}

                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePromoteToTemplate}
                    disabled={
                      !newTemplateName.trim() ||
                      (createFromBase === 'html' && !importHtml.trim()) ||
                      (createFromBase === 'duplicate' && !duplicateSourceTemplateId) ||
                      promotingTemplate
                    }
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {promotingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    {promotingTemplate ? 'Creating...' : 'Create Template'}
                  </button>
                  <button onClick={() => { setCreatingTemplate(false); setNewTemplateName(''); setNewTemplateDesc(''); setImportHtml(''); setDuplicateSourceTemplateId(''); setCreateFromBase('default'); setCreateAsGlobalDefault(false); }} className="px-4 py-2 text-gray-600 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
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
                      <div key={template.id} className="border border-gray-200 rounded-lg overflow-visible">
                        <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50 rounded-t-lg">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${template.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                              <Layout className={`w-4 h-4 ${template.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                {renamingTemplateId === template.id ? (
                                  /* ── Inline rename mode ── */
                                  <form
                                    className="flex items-center gap-1.5"
                                    onSubmit={async (e) => {
                                      e.preventDefault();
                                      const trimmed = renameValue.trim();
                                      if (!trimmed || trimmed === template.name) { setRenamingTemplateId(null); return; }
                                      setRenameSaving(true);
                                      try {
                                        const res = await fetch(`/api/layout-templates/${template.id}`, {
                                          method: 'PUT',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ name: trimmed }),
                                        });
                                        const data = await res.json();
                                        if (data.success) {
                                          setLayoutTemplates((prev) => prev.map((t) => t.id === template.id ? { ...t, name: trimmed } : t));
                                          setSuccess(`Template renamed to "${trimmed}".`);
                                          setTimeout(() => setSuccess(null), 3000);
                                        } else {
                                          setError(data.error || 'Failed to rename');
                                        }
                                      } catch { setError('Failed to rename template'); }
                                      finally { setRenameSaving(false); setRenamingTemplateId(null); }
                                    }}
                                  >
                                    <input
                                      ref={renameInputRef}
                                      value={renameValue}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Escape') setRenamingTemplateId(null); }}
                                      className="px-2 py-0.5 text-sm font-semibold border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 w-48"
                                      autoFocus
                                    />
                                    <button type="submit" disabled={renameSaving} className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50" title="Save name">
                                      {renameSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                    </button>
                                    <button type="button" onClick={() => setRenamingTemplateId(null)} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Cancel">
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </form>
                                ) : (
                                  /* ── Display mode ── */
                                  <div className="flex items-center gap-1.5 group/name min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                                    <button
                                      onClick={() => { setRenamingTemplateId(template.id); setRenameValue(template.name); setTimeout(() => renameInputRef.current?.select(), 30); }}
                                      className="p-0.5 rounded opacity-0 group-hover/name:opacity-100 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-opacity flex-shrink-0"
                                      title="Rename template"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                                <span className="text-xs text-gray-400 flex-shrink-0">v{template.version}</span>
                                {!template.isActive && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Inactive</span>}
                                {template.isDefault && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex-shrink-0 flex items-center gap-1">🌐 Global Default</span>}
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
                            <button
                              onClick={async () => {
                                const newValue = !template.isDefault;
                                setSettingDefaultTemplateId(template.id);
                                try {
                                  const res = await fetch(`/api/layout-templates/${template.id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ isDefault: newValue }),
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    // Clear isDefault on all, then set on this one
                                    setLayoutTemplates((prev) => prev.map((t) => ({
                                      ...t,
                                      isDefault: newValue ? t.id === template.id : false,
                                    })));
                                    setSuccess(newValue ? `"${template.name}" is now the Global Default — it will be used by all companies without a specific layout or assigned template.` : 'Global default cleared. Companies without an assigned layout will use the built-in default.');
                                    setTimeout(() => setSuccess(null), 4000);
                                  } else {
                                    setError(data.error || 'Failed to update');
                                  }
                                } finally {
                                  setSettingDefaultTemplateId(null);
                                }
                              }}
                              disabled={settingDefaultTemplateId === template.id}
                              className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 transition-colors border ${template.isDefault ? 'bg-green-50 border-green-300 text-green-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600' : 'border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-300 hover:text-green-700'}`}
                              title={template.isDefault ? 'Clear: stop assigning to new companies' : 'Set as default for new companies'}
                            >
                              {settingDefaultTemplateId === template.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Check className={`w-3.5 h-3.5 ${template.isDefault ? 'text-green-600' : 'text-gray-400'}`} />}
                              {template.isDefault ? 'Default' : 'Set as default'}
                            </button>
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

                        {/* Assign to company — searchable multi-select */}
                        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 rounded-b-lg">
                          <div className="flex items-start gap-3 flex-wrap">
                            <span className="text-xs text-gray-500 font-medium flex-shrink-0 pt-1.5">Assign to:</span>

                            {/* Trigger button + dropdown */}
                            <div
                              ref={assignDropdownOpen === template.id ? assignDropdownRef : null}
                              className="relative"
                            >
                              <button
                                onClick={() => {
                                  if (assignDropdownOpen === template.id) {
                                    setAssignDropdownOpen(null);
                                    setAssignSearch('');
                                    setAssignPending(new Set());
                                  } else {
                                    setAssignDropdownOpen(template.id);
                                    setAssignSearch('');
                                    setAssignPending(new Set());
                                  }
                                }}
                                className="flex items-center gap-1.5 text-xs border border-gray-300 rounded-lg px-3 py-1.5 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                              >
                                <Plus className="w-3 h-3 text-gray-400" />
                                Add companies
                                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${assignDropdownOpen === template.id ? 'rotate-180' : ''}`} />
                              </button>

                              {/* Dropdown panel */}
                              {assignDropdownOpen === template.id && (
                                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                                  {/* Search */}
                                  <div className="p-2 border-b border-gray-100">
                                    <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                                      <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                      <input
                                        autoFocus
                                        type="text"
                                        placeholder="Search companies…"
                                        value={assignSearch}
                                        onChange={(e) => setAssignSearch(e.target.value)}
                                        className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                                      />
                                      {assignSearch && (
                                        <button onClick={() => setAssignSearch('')} className="text-gray-400 hover:text-gray-600">
                                          <X className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Company list */}
                                  <div className="max-h-52 overflow-y-auto">
                                    {(() => {
                                      const unassigned = companies.filter(
                                        (c) => !assignedCompanies.some((ac) => ac.id === c.id)
                                      );
                                      const filtered = assignSearch.trim()
                                        ? unassigned.filter((c) =>
                                            c.companyName.toLowerCase().includes(assignSearch.toLowerCase())
                                          )
                                        : unassigned;

                                      if (filtered.length === 0) {
                                        return (
                                          <p className="text-xs text-gray-400 text-center py-6">
                                            {unassigned.length === 0 ? 'All companies already assigned' : 'No matches found'}
                                          </p>
                                        );
                                      }

                                      return filtered.map((c) => {
                                        const isSelected = assignPending.has(c.id ?? '');
                                        return (
                                          <button
                                            key={c.id}
                                            onClick={() => {
                                              setAssignPending((prev) => {
                                                const next = new Set(prev);
                                                if (next.has(c.id ?? '')) next.delete(c.id ?? '');
                                                else next.add(c.id ?? '');
                                                return next;
                                              });
                                            }}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                                          >
                                            <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                                              {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                            </div>
                                            <span className="text-xs text-gray-700 truncate">{c.companyName}</span>
                                          </button>
                                        );
                                      });
                                    })()}
                                  </div>

                                  {/* Footer: selected count + Apply */}
                                  <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 flex items-center justify-between gap-2">
                                    <span className="text-xs text-gray-500">
                                      {assignPending.size === 0
                                        ? 'Select companies above'
                                        : `${assignPending.size} selected`}
                                    </span>
                                    <button
                                      onClick={() => handleAssignMultiple(template.id)}
                                      disabled={assignPending.size === 0 || assigningSaving}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {assigningSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                      Assign
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Assigned company pills */}
                            {assignedCompanies.map((ac) => (
                              <div key={ac.id} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                                {ac.name}
                                <button
                                  onClick={() => handleAssignTemplate(template.id, ac.id, true)}
                                  className="ml-0.5 hover:text-red-600 transition-colors"
                                  title="Unassign"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Template blocks toggle */}
                        {(() => {
                          const tmplKey = `tmpl-${template.id}`;
                          const isExpTmpl = expandedLayouts.has(tmplKey);
                          return (
                            <div className="border-t border-gray-100">
                              <button
                                onClick={() => toggleLayoutExpanded(tmplKey)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 transition-colors text-left"
                              >
                                {isExpTmpl
                                  ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                  : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                                }
                                <span className="text-xs font-medium text-gray-600">Edit Blocks</span>
                                <Pencil className="w-3 h-3 text-gray-400" />
                              </button>
                              {isExpTmpl && (
                                <TemplateSectionBlockEditor
                                  templateId={template.id}
                                  editingBlockKey={editingBlockKey}
                                  editingBlockHtml={editingBlockHtml}
                                  savingBlock={savingBlock}
                                  blockEditorExpandedCats={blockEditorExpandedCats}
                                  onOpenBlock={openBlockEditor}
                                  onCloseBlock={closeBlockEditor}
                                  onChangeHtml={setEditingBlockHtml}
                                  onSaveBlock={saveTemplateBlock}
                                  onToggleCat={(c) => setBlockEditorExpandedCats((prev) => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; })}
                                  onInsertPlaceholder={insertPlaceholderInBlockEditor}
                                  textareaRef={blockEditorTextareaRef}
                                />
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
        )} {/* end LAYOUT TEMPLATES TAB */}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && user?.isAdmin && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Users</h2>
                <p className="text-sm text-gray-500 mt-0.5">Manage users and their company access</p>
              </div>
              <button
                onClick={() => { setEditingUser(null); setIsAddingUser(true); loadRoles(); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add User
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No users yet. Add a user to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Companies</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="py-2 px-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3 font-medium text-gray-900">{u.name}</td>
                        <td className="py-3 px-3 text-gray-500 font-mono text-xs">{u.username}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.roleName === 'Admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {u.roleName}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-500">
                          {u.companies.length === 0
                            ? <span className="text-gray-300 italic text-xs">All companies</span>
                            : <span className="text-xs">{u.companies.map(c => c.name).join(', ')}</span>
                          }
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1 justify-end">
                            <button
                              onClick={() => { setEditingUser(u); setIsAddingUser(true); loadRoles(); }}
                              className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Delete user "${u.name}"?`)) return;
                                const res = await fetch(`/api/settings/users/${u.id}`, { method: 'DELETE', headers: authHeader });
                                if (res.ok) setUsers(prev => prev.filter(x => x.id !== u.id));
                                else setError('Failed to delete user');
                              }}
                              className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add/Edit User Modal */}
          {isAddingUser && (
            <UserFormModal
              user={editingUser}
              roles={roles}
              companies={companies}
              authHeader={authHeader}
              onSave={(saved) => {
                if (editingUser) {
                  setUsers(prev => prev.map(u => u.id === saved.id ? saved : u));
                } else {
                  setUsers(prev => [...prev, saved]);
                }
                setIsAddingUser(false);
                setEditingUser(null);
              }}
              onClose={() => { setIsAddingUser(false); setEditingUser(null); }}
            />
          )}
        </div>
        )} {/* end USERS TAB */}

        {/* ── ROLES TAB ── */}
        {activeTab === 'roles' && user?.isAdmin && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Roles</h2>
                <p className="text-sm text-gray-500 mt-0.5">Define what each role is permitted to do</p>
              </div>
              <button
                onClick={() => { setEditingRole(null); setIsAddingRole(true); }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Role
              </button>
            </div>

            {loadingRoles ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : roles.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No roles yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roles.map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-4 py-3 border border-gray-100 rounded-xl hover:border-gray-200 hover:bg-gray-50 transition-all">
                    <Shield className={`w-5 h-5 flex-shrink-0 ${r.isSystem ? 'text-purple-500' : 'text-blue-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{r.name}</span>
                        {r.isSystem && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full font-medium">System</span>
                        )}
                      </div>
                      {r.description && <p className="text-xs text-gray-400 mt-0.5">{r.description}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {r.permissions.length === 0
                          ? <span className="text-xs text-gray-300 italic">No special permissions — company access only</span>
                          : r.permissions.map(p => (
                            <span key={p} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">{p}</span>
                          ))
                        }
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{r.userCount ?? 0} user{r.userCount !== 1 ? 's' : ''}</span>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => { setEditingRole(r); setIsAddingRole(true); }}
                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        Edit
                      </button>
                      {!r.isSystem && (
                        <button
                          onClick={async () => {
                            if (!window.confirm(`Delete role "${r.name}"?`)) return;
                            const res = await fetch(`/api/settings/roles/${r.id}`, { method: 'DELETE', headers: authHeader });
                            const data = await res.json();
                            if (data.success) setRoles(prev => prev.filter(x => x.id !== r.id));
                            else setError(data.error || 'Failed to delete role');
                          }}
                          className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add/Edit Role Modal */}
          {isAddingRole && (
            <RoleFormModal
              role={editingRole}
              authHeader={authHeader}
              onSave={(saved) => {
                if (editingRole) {
                  setRoles(prev => prev.map(r => r.id === saved.id ? saved : r));
                } else {
                  setRoles(prev => [...prev, saved]);
                }
                setIsAddingRole(false);
                setEditingRole(null);
              }}
              onClose={() => { setIsAddingRole(false); setEditingRole(null); }}
            />
          )}
        </div>
        )} {/* end ROLES TAB */}

      </main>
    </div>
  );
}

// ── User Form Modal ────────────────────────────────────────────────────────────

function UserFormModal({
  user: editUser,
  roles,
  companies,
  authHeader,
  onSave,
  onClose,
}: {
  user: UserRecord | null;
  roles: RoleRecord[];
  companies: CompanyBranding[];
  authHeader: Record<string, string>;
  onSave: (user: UserRecord) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editUser?.name ?? '');
  const [username, setUsername] = useState(editUser?.username ?? '');
  const [email, setEmail] = useState(editUser?.email ?? '');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(editUser?.roleId ?? '');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>(
    editUser?.companies.map(c => c.id) ?? [],
  );
  const [isActive, setIsActive] = useState(editUser?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCompany = (id: string) => {
    setSelectedCompanyIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (!name.trim() || !username.trim() || !roleId) {
      setError('Name, username and role are required');
      return;
    }
    if (!editUser && (!password || password.length < 8)) {
      setError('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = editUser ? `/api/settings/users/${editUser.id}` : '/api/settings/users';
      const method = editUser ? 'PUT' : 'POST';
      const body: Record<string, unknown> = {
        name, username, email: email || null, roleId,
        companyIds: selectedCompanyIds, isActive,
      };
      if (password) body.password = password;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Save failed'); return; }
      onSave(data.data);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">{editUser ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Username *</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="jane.smith"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="jane@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {editUser ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min. 8 characters"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Role *</label>
            <select
              value={roleId}
              onChange={e => setRoleId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a role…</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">
              Assigned Companies
              <span className="ml-1 font-normal text-gray-400">(leave empty to allow access to all companies)</span>
            </label>
            <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-gray-50">
              {companies.map(c => (
                <label key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompanyIds.includes(c.id ?? '')}
                    onChange={() => c.id && toggleCompany(c.id)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{c.companyName}</span>
                  <span className="ml-auto text-xs text-gray-400">{c.companyId}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}
            >
              <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
            <span className="text-sm text-gray-600">Account active</span>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {editUser ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role Form Modal ────────────────────────────────────────────────────────────

const AVAILABLE_PERMISSIONS = [
  { key: 'all', label: 'Full admin access', description: 'Grants all permissions' },
  { key: 'view_all_companies', label: 'View all companies', description: 'Can see all companies regardless of assignment' },
  { key: 'manage_companies', label: 'Manage companies', description: 'Can edit company settings and branding' },
  { key: 'manage_users', label: 'Manage users', description: 'Can create, edit and delete users' },
  { key: 'manage_roles', label: 'Manage roles', description: 'Can create, edit and delete roles' },
];

function RoleFormModal({
  role: editRole,
  authHeader,
  onSave,
  onClose,
}: {
  role: RoleRecord | null;
  authHeader: Record<string, string>;
  onSave: (role: RoleRecord) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(editRole?.name ?? '');
  const [description, setDescription] = useState(editRole?.description ?? '');
  const [permissions, setPermissions] = useState<string[]>(editRole?.permissions ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePermission = (key: string) => {
    setPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key],
    );
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError(null);
    try {
      const url = editRole ? `/api/settings/roles/${editRole.id}` : '/api/settings/roles';
      const method = editRole ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify({ name, description, permissions }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || 'Save failed'); return; }
      onSave(data.data);
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-bold text-gray-900">{editRole ? 'Edit Role' : 'Add Role'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Role Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={editRole?.isSystem}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              placeholder="e.g. Manager"
            />
            {editRole?.isSystem && <p className="text-xs text-gray-400 mt-1">System role names cannot be changed</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of what this role can do"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Permissions</label>
            <div className="space-y-2">
              {AVAILABLE_PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissions.includes(p.key)}
                    onChange={() => togglePermission(p.key)}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.label}</div>
                    <div className="text-xs text-gray-400">{p.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {editRole ? 'Save Changes' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  );
}
