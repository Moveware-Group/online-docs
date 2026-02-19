'use client';

import { useState, useEffect, useRef } from 'react';
import { Building2, Plus, Loader2, AlertCircle, Check, LogOut, Upload, X, Image as ImageIcon, Wand2, Layout, Trash2, Search, Copy, Tag, ChevronDown, ChevronRight, Users, Pencil, Code2, Save as SaveIcon, HelpCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { LoginForm } from '@/lib/components/auth/login-form';
import { PLACEHOLDER_REGISTRY, PLACEHOLDER_CATEGORIES, type PlaceholderCategory } from '@/lib/data/placeholder-registry';
import { GRACE_STATIC_LAYOUT } from '@/lib/layouts/grace-static';
import { DEFAULT_STATIC_LAYOUT } from '@/lib/layouts/default-static';

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
  /** Moveware REST API username (read/write) */
  mwUsername?: string;
  /** True when a password is already stored — password itself is never returned from the API */
  mwPasswordSet?: boolean;
  /** Write-only: a new password entered by the user. Empty = keep existing. */
  mwPassword?: string;
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

  // Layout templates state
  const [layoutTemplates, setLayoutTemplates] = useState<LayoutTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [promoteCompanyId, setPromoteCompanyId] = useState('');
  const [promotingTemplate, setPromotingTemplate] = useState(false);
  const [createFromBase, setCreateFromBase] = useState<'grace' | 'default'>('default');
  const [settingDefaultTemplateId, setSettingDefaultTemplateId] = useState<string | null>(null);
  const [createAsGlobalDefault, setCreateAsGlobalDefault] = useState(false);

  // Template company-assignment multi-select dropdown
  const [assignDropdownOpen, setAssignDropdownOpen] = useState<string | null>(null); // templateId
  const [assignSearch, setAssignSearch] = useState('');
  const [assignPending, setAssignPending] = useState<Set<string>>(new Set()); // companyIds pending
  const [assigningSaving, setAssigningSaving] = useState(false);
  const assignDropdownRef = useRef<HTMLDivElement>(null);

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
      } else {
        res = await fetch('/api/layout-templates/promote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: promoteCompanyId, name: newTemplateName, description: newTemplateDesc }),
        });
      }
      const data = await res.json();
      if (data.success) {
        setLayoutTemplates((prev) => [data.data, ...prev]);
        setNewTemplateName('');
        setNewTemplateDesc('');
        setPromoteCompanyId('');
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
            {[
              { id: 'companies', label: 'Companies', icon: <Building2 className="w-4 h-4" /> },
              { id: 'layouts', label: 'Layout Templates', icon: <Layout className="w-4 h-4" /> },
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
                        {/* Actions — fixed width so variable label ("Create"/"Edit" Layout) never shifts colours */}
                        <div className="flex gap-2 flex-shrink-0 w-[272px] justify-end">
                          <a
                            href={
                              company.layoutTemplateId
                                ? `/settings/layout-builder?templateId=${company.layoutTemplateId}`
                                : `/settings/layout-builder?companyId=${company.id}`
                            }
                            className="px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 rounded transition-colors flex items-center gap-1"
                          >
                            <Wand2 className="w-3 h-3" />
                            {company.layoutTemplateId ? 'Edit Layout' : 'Create Layout'}
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

        </> /* end COMPANIES TAB */
        )}

        {/* ── LAYOUT TEMPLATES TAB ── */}
        {activeTab === 'layouts' && (
        <div className="space-y-6">

          {/* Company layouts have been consolidated into Layout Templates.
              Use the Layout Builder to create/edit a template per company. */}
          {false && <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-600" />
                  Company Layouts
                  {/* Help button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowLayoutHelp((v) => !v)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      title="What are Company Layouts vs Layout Templates?"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                    {showLayoutHelp && (
                      <div className="absolute left-0 top-7 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-sm">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-900">Company Layouts vs Templates</span>
                          <button onClick={() => setShowLayoutHelp(false)} className="text-gray-400 hover:text-gray-600"><X className="w-3.5 h-3.5" /></button>
                        </div>

                        <div className="space-y-3 text-gray-700">
                          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                            <p className="font-semibold text-purple-800 flex items-center gap-1.5 mb-1">
                              <Wand2 className="w-3.5 h-3.5" /> Company Layout
                            </p>
                            <p className="text-xs leading-relaxed">
                              A layout saved <strong>specifically for one company</strong>. Created and edited in the AI Layout Builder — this is where you drag blocks, edit copy, and upload banner/footer images. Each company has their own independent version.
                            </p>
                          </div>

                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="font-semibold text-blue-800 flex items-center gap-1.5 mb-1">
                              <Layout className="w-3.5 h-3.5" /> Layout Template
                            </p>
                            <p className="text-xs leading-relaxed">
                              A <strong>shared, reusable base</strong> that multiple companies can point to. All companies assigned to the template share the same block structure and copy, but each company&apos;s own banner image, footer image, and brand colors are applied on top.
                            </p>
                          </div>

                          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <p className="font-semibold text-gray-800 mb-1 text-xs">When to use which?</p>
                            <ul className="text-xs space-y-1 text-gray-600">
                              <li>• <strong>One company, unique layout</strong> → Company Layout</li>
                              <li>• <strong>Same structure across many companies</strong> → Template</li>
                              <li>• Promote a Company Layout to a Template using <strong>Save as Template</strong></li>
                              <li>• Mark a template as <strong>🌐 Global Default</strong> to apply it to every company with no other layout</li>
                              <li>• Templates override a company&apos;s own layout when assigned</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Custom layouts saved per company. Edit individual blocks here, or open the Layout Builder for the full visual editor.
                </p>
              </div>
              <button
                onClick={loadCompanyLayouts}
                disabled={loadingCompanyLayouts}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {loadingCompanyLayouts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                Refresh
              </button>
            </div>

            {loadingCompanyLayouts ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-500" /></div>
            ) : companyLayoutsList.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Wand2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-sm">No saved company layouts yet</p>
                <p className="text-xs mt-1">Open the Layout Builder for any company and click &ldquo;Approve &amp; Save&rdquo; to create one.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {companyLayoutsList.map((record) => {
                  const sections = record.layoutConfig?.sections || [];
                  const isExpanded = expandedLayouts.has(record.companyId);
                  return (
                    <div key={record.companyId} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Card header */}
                      <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
                        <button
                          onClick={() => toggleLayoutExpanded(record.companyId)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          }
                          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Wand2 className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{record.company.name}</div>
                            <div className="text-xs text-gray-500">
                              v{record.version} · {sections.length} block{sections.length !== 1 ? 's' : ''} · {record.isActive ? 'Active' : 'Inactive'}
                              {record.description && ` · ${record.description}`}
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          <button
                            onClick={async () => {
                              const matchedCompany = companies.find((c) => c.id === record.companyId || c.companyId === record.company.tenantId);
                              const hasTemplate = !!matchedCompany?.layoutTemplateId;
                              const confirmMsg = hasTemplate
                                ? `Remove the saved custom layout for "${record.company.name}"?\n\nThe Layout Template assigned to this company will be used automatically. Any block-level edits made in the Layout Builder will be lost.`
                                : `Remove the saved custom layout for "${record.company.name}"?\n\n⚠️ WARNING: This company has no Layout Template assigned. Removing the saved layout will cause the default quote layout to be shown instead.\n\nAssign a Layout Template to this company first, then reset.`;
                              if (!confirm(confirmMsg)) return;
                              setSyncingLayoutId(record.companyId);
                              try {
                                const res = await fetch('/api/layouts/reset', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ companyId: record.companyId }),
                                });
                                const data = await res.json();
                                if (data.success) {
                                  await loadCompanyLayouts();
                                } else {
                                  alert(`Reset failed: ${data.error}`);
                                }
                              } finally {
                                setSyncingLayoutId(null);
                              }
                            }}
                            disabled={syncingLayoutId === record.companyId}
                            className="px-3 py-1.5 text-xs text-amber-600 hover:bg-amber-50 rounded-lg flex items-center gap-1 transition-colors border border-amber-200 disabled:opacity-50"
                            title="Remove this company's saved layout so the assigned template is used instead"
                          >
                            {syncingLayoutId === record.companyId
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <RefreshCw className="w-3.5 h-3.5" />}
                            Reset to Template
                          </button>
                          {/* Clone any template → this company's custom layout */}
                          {layoutTemplates.length > 0 && (
                            <button
                              disabled={cloningTemplateToLayoutId === record.companyId}
                              onClick={() => {
                                if (clonePickerCompanyId === record.companyId) {
                                  setClonePickerCompanyId(null);
                                  setClonePickerTemplateId('');
                                } else {
                                  // Pre-select the company's assigned template if available
                                  const matchedCo = companies.find((c) => c.id === record.companyId || c.companyId === record.company?.tenantId);
                                  setClonePickerTemplateId(matchedCo?.layoutTemplateId || layoutTemplates[0]?.id || '');
                                  setClonePickerCompanyId(record.companyId);
                                }
                              }}
                              className={`px-3 py-1.5 text-xs rounded-lg flex items-center gap-1 transition-colors border disabled:opacity-50 ${clonePickerCompanyId === record.companyId ? 'bg-green-50 border-green-400 text-green-800' : 'text-green-700 hover:bg-green-50 border-green-300'}`}
                              title="Copy a template into this company's editable layout"
                            >
                              {cloningTemplateToLayoutId === record.companyId
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Copy className="w-3.5 h-3.5" />}
                              Clone from Template
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handlePromoteToTemplate();
                              setPromoteCompanyId(record.companyId);
                              setCreatingTemplate(true);
                            }}
                            className="px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg flex items-center gap-1 transition-colors border border-purple-200"
                            title="Promote to shared template"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Save as Template
                          </button>
                          <a
                            href={`/settings/layout-builder?companyId=${record.companyId}`}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            Edit in Builder
                          </a>
                        </div>
                      </div>

                      {/* Clone-from-template picker — shown inline when button is active */}
                      {clonePickerCompanyId === record.companyId && (
                        <div className="border-t border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3 flex-wrap">
                          <span className="text-xs font-medium text-green-800 flex-shrink-0">Clone from:</span>
                          <select
                            value={clonePickerTemplateId}
                            onChange={(e) => setClonePickerTemplateId(e.target.value)}
                            className="flex-1 min-w-[160px] px-2 py-1.5 text-xs border border-green-300 rounded-lg bg-white focus:ring-2 focus:ring-green-400"
                          >
                            {layoutTemplates.map((t) => (
                              <option key={t.id} value={t.id}>{t.name} v{t.version}</option>
                            ))}
                          </select>
                          <button
                            disabled={!clonePickerTemplateId || cloningTemplateToLayoutId === record.companyId}
                            onClick={async () => {
                              const tmpl = layoutTemplates.find((t) => t.id === clonePickerTemplateId);
                              if (!tmpl) return;
                              if (!confirm(`Replace the company layout for "${record.company.name}" with the content of template "${tmpl.name}"?\n\nThis creates an editable company-specific copy. The template itself is not changed.`)) return;
                              setCloningTemplateToLayoutId(record.companyId);
                              try {
                                const tmplRes = await fetch(`/api/layout-templates/${clonePickerTemplateId}`);
                                const tmplData = await tmplRes.json();
                                if (!tmplData.success) { alert('Failed to load template: ' + (tmplData.error || 'unknown error')); return; }
                                const saveRes = await fetch(`/api/layouts/${record.companyId}`, {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ layoutConfig: tmplData.data.layoutConfig, isActive: true, description: `Cloned from template: ${tmpl.name}` }),
                                });
                                const saveData = await saveRes.json();
                                if (saveData.success) {
                                  setClonePickerCompanyId(null);
                                  setClonePickerTemplateId('');
                                  await loadCompanyLayouts();
                                  setSuccess(`Company layout for "${record.company.name}" replaced with "${tmpl.name}". Open the Layout Builder to make company-specific edits.`);
                                  setTimeout(() => setSuccess(null), 5000);
                                } else {
                                  alert('Failed to save: ' + (saveData.error || 'unknown error'));
                                }
                              } finally {
                                setCloningTemplateToLayoutId(null);
                              }
                            }}
                            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {cloningTemplateToLayoutId === record.companyId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
                            Apply
                          </button>
                          <button
                            onClick={() => { setClonePickerCompanyId(null); setClonePickerTemplateId(''); }}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {/* Expanded: block list */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-2">
                          <p className="text-xs font-medium text-gray-600 mb-3">Blocks — click <Pencil className="w-3 h-3 inline" /> to edit HTML</p>
                          {sections.map((section, idx) => {
                            const blockKey = `${record.companyId}:${idx}`;
                            const isEditing = editingBlockKey === blockKey;
                            const label = section.label || section.id || `Block ${idx + 1}`;
                            const isHidden = section.visible === false;
                            return (
                              <div key={section.id || idx}>
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-white ${isEditing ? 'border-blue-400' : 'border-gray-200'}`}>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-800 truncate block">{label}</span>
                                    <span className="text-xs text-gray-400">
                                      {section.type === 'custom_html' ? 'HTML' : section.type}
                                      {isHidden && ' · hidden'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400 font-mono w-5 text-center">{idx + 1}</span>
                                  {section.type === 'custom_html' && (
                                    <button
                                      onClick={() =>
                                        isEditing
                                          ? closeBlockEditor()
                                          : openBlockEditor(record.companyId, idx, section.html || '')
                                      }
                                      title={isEditing ? 'Close editor' : 'Edit HTML'}
                                      className={`p-1.5 rounded transition-colors ${isEditing ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>

                                {/* Inline block editor */}
                                {isEditing && (
                                  <BlockHtmlEditor
                                    html={editingBlockHtml}
                                    onChange={setEditingBlockHtml}
                                    onSave={() => saveCompanyLayoutBlock(record.companyId, idx)}
                                    onCancel={closeBlockEditor}
                                    saving={savingBlock}
                                    textareaRef={blockEditorTextareaRef}
                                    expandedCats={blockEditorExpandedCats}
                                    onToggleCat={(c) => setBlockEditorExpandedCats((prev) => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; })}
                                    onInsertPlaceholder={insertPlaceholderInBlockEditor}
                                  />
                                )}
                              </div>
                            );
                          })}
                          {sections.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">No blocks found in this layout.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>}

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
                  <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span><strong>Company Layout</strong> — a layout built specifically for this company in the Layout Builder.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span><strong>Global Default Template</strong> — the template marked <span className="font-semibold text-green-700">🌐 Global Default</span> below applies to ALL companies with no assigned template or custom layout. Edit it to change what every new client sees.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-400 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
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
                  <p className="text-xs text-amber-700 mt-0.5">All companies without an assigned template or company layout will fall back to the built-in hard-coded default. Create a Global Default template to control what they see.</p>
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
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => { setCreateFromBase('default'); setPromoteCompanyId(''); }}
                      className={`flex-1 min-w-[120px] px-3 py-2 text-xs rounded-lg border transition-colors ${createFromBase === 'default' ? 'bg-blue-50 border-blue-400 text-blue-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      From Default Layout <span className="ml-1 text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">built-in</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setCreateFromBase('grace'); setPromoteCompanyId(''); }}
                      className={`flex-1 min-w-[120px] px-3 py-2 text-xs rounded-lg border transition-colors ${createFromBase === 'grace' ? 'bg-purple-50 border-purple-400 text-purple-700 font-medium' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      From Grace Base Layout <span className="ml-1 text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">latest</span>
                    </button>
                  </div>
                  {createFromBase === 'default' && (
                    <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                      Creates the template from the standard built-in quote layout (Header, Intro, Locations, Pricing, Inventory, Accept Quote). The same layout all companies use before any customisation is applied.
                    </div>
                  )}
                  {createFromBase === 'grace' && (
                    <div className="px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-700">
                      Creates the template from the current built-in Grace base layout (<code>grace-static.ts</code>). Use this to seed a fresh, up-to-date Grace layout that you can then assign to companies.
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handlePromoteToTemplate}
                    disabled={!newTemplateName.trim() || promotingTemplate}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {promotingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                    {promotingTemplate ? 'Creating...' : 'Create Template'}
                  </button>
                  <button onClick={() => { setCreatingTemplate(false); setNewTemplateName(''); setNewTemplateDesc(''); setPromoteCompanyId(''); setCreateFromBase('default'); setCreateAsGlobalDefault(false); }} className="px-4 py-2 text-gray-600 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
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
                                <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
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

      </main>
    </div>
  );
}
