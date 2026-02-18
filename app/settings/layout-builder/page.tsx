'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  Wand2,
  Send,
  Save,
  Loader2,
  Upload,
  FileText,
  Pencil,
  X,
  Bot,
  User,
  ArrowLeft,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Copy,
  Check,
  GripVertical,
  Layers,
  Tag,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Plus,
  Trash2,
  CopyPlus,
  Image as ImageIcon,
  Type,
  Code2,
  Columns,
  LayoutTemplate,
  Filter,
  FilterX,
  Settings2,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { LoginForm } from '@/lib/components/auth/login-form';
import {
  CompanySearchDropdown,
  CompanyOption,
} from '@/lib/components/forms/company-search-dropdown';
import type { LayoutConfig, SectionCondition } from '@/lib/services/llm-service';
import { LayoutBuilderChatWidget } from '@/lib/components/chat/layout-builder-chat-widget';
import {
  PLACEHOLDER_REGISTRY,
  PLACEHOLDER_CATEGORIES,
  type PlaceholderCategory,
} from '@/lib/data/placeholder-registry';

// ---------------------------------------------------------------------------
// Smart copy extractor — DOMParser-based text field extraction
// ---------------------------------------------------------------------------

interface CopyField {
  id: string;
  label: string;
  value: string;
  sentinel: string;
}

/** Labels inferred from a text node's parent element tag */
const TAG_LABELS: Record<string, string> = {
  h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3', h4: 'Subheading',
  h5: 'Subheading', h6: 'Subheading',
  p: 'Paragraph', span: 'Text', a: 'Link', button: 'Button',
  td: 'Table Cell', th: 'Table Header', li: 'List Item',
  label: 'Label', div: 'Text Block',
};

/** Extract editable text fields from raw HTML. Returns fields + sentinelled HTML. */
function extractCopyFields(html: string): { fields: CopyField[]; markedHtml: string } {
  if (typeof window === 'undefined') return { fields: [], markedHtml: html };
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const fields: CopyField[] = [];
  let counter = 0;

  // Count by label to build distinct names
  const labelCounts: Record<string, number> = {};

  const getLabel = (node: Text): string => {
    const raw = (node.textContent || '').trim();
    // If the entire text node is a single placeholder, show the key name as the label
    const placeholderMatch = raw.match(/^\{\{([^}]+)\}\}$/);
    if (placeholderMatch) return `{{${placeholderMatch[1]}}}`;
    const parent = node.parentElement;
    if (!parent) return 'Text';
    return TAG_LABELS[parent.tagName.toLowerCase()] || 'Text';
  };

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const textNode = node as Text;
      const raw = textNode.textContent || '';
      const trimmed = raw.trim();
      if (trimmed.length < 2) return;
      if (/^\s+$/.test(trimmed)) return;
      // Skip Handlebars block helpers ({{#each}}, {{/each}}, etc.) — not editable copy
      if (/^\{\{[#/!^]/.test(trimmed)) return;
      // Skip CSS-like content inside <style>
      const parentTag = (textNode.parentElement?.tagName || '').toUpperCase();
      if (['STYLE', 'SCRIPT', 'INPUT', 'SELECT', 'TEXTAREA'].includes(parentTag)) return;

      const baseLabel = getLabel(textNode);
      labelCounts[baseLabel] = (labelCounts[baseLabel] || 0) + 1;
      const isPurePlaceholder = /^\{\{[^}]+\}\}$/.test(trimmed);
      // Regular text: always numbered ("Text Block 1", "Text Block 2", …)
      // Pure placeholder: only add a count when there are duplicates ("{{customerName}}", "{{customerName}} (2)")
      const label = isPurePlaceholder
        ? (labelCounts[baseLabel] > 1 ? `${baseLabel} (${labelCounts[baseLabel]})` : baseLabel)
        : `${baseLabel} ${labelCounts[baseLabel]}`;
      const sentinel = `__COPY_${counter}__`;

      fields.push({ id: String(counter), label, value: raw, sentinel });
      textNode.textContent = sentinel;
      counter++;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const skipTags = ['STYLE', 'SCRIPT', 'INPUT', 'SELECT', 'TEXTAREA'];
      if (skipTags.includes((node as Element).tagName)) return;
      for (const child of Array.from(node.childNodes)) walk(child);
    }
  };

  walk(doc.body);
  return { fields, markedHtml: doc.body.innerHTML };
}

/** Reconstruct HTML from copy fields, replacing sentinels with edited values */
function reconstructFromCopyFields(markedHtml: string, fields: CopyField[]): string {
  let result = markedHtml;
  for (const f of fields) {
    // escape for use as literal string replacement
    result = result.replace(f.sentinel, () => f.value);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

function LayoutBuilderContent() {
  const searchParams = useSearchParams();
  const preselectedCompanyId = searchParams.get('companyId');
  const preselectedTemplateId = searchParams.get('templateId');

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Form state
  const [selectedCompany, setSelectedCompany] = useState<CompanyOption | null>(null);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const [referenceFilePath, setReferenceFilePath] = useState('');
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [bannerImagePath, setBannerImagePath] = useState('');
  const [footerImageFile, setFooterImageFile] = useState<File | null>(null);
  const [footerImagePath, setFooterImagePath] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingFooter, setUploadingFooter] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Layout state
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // When the builder is opened via ?templateId=..., we're editing a global template
  // (not a company layout). This ID is used to route the Save call correctly.
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState<string | null>(null);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Status messages
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Left panel tabs: 'setup' | 'blocks' | 'placeholders'
  const [leftPanelTab, setLeftPanelTab] = useState<'setup' | 'blocks' | 'placeholders'>('setup');

  // Custom preview URL (optional — overrides the default job URL)
  const [previewJobUrl, setPreviewJobUrl] = useState('');

  // Placeholder copy state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<PlaceholderCategory>>(
    new Set(['Customer', 'Job', 'Branding', 'Dates'])
  );

  // Block drag-and-drop state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Add-block modal
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);

  // Condition editor state — tracks which block row has the inline editor open
  const [conditionEditorIndex, setConditionEditorIndex] = useState<number | null>(null);
  const [conditionDraft, setConditionDraft] = useState<SectionCondition>({ field: 'job.moveType', operator: '==', value: '' });

  const [formConfigEditorIndex, setFormConfigEditorIndex] = useState<number | null>(null);

  // Block editor state
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editingBlockContent, setEditingBlockContent] = useState('');
  const [showHtmlEditor, setShowHtmlEditor] = useState(false);
  const [copyFields, setCopyFields] = useState<CopyField[]>([]);
  const [markedHtml, setMarkedHtml] = useState('');
  const editBlockTextareaRef = useRef<HTMLTextAreaElement>(null);
  // Editable block config (e.g. image max-heights)
  const [editingBlockConfig, setEditingBlockConfig] = useState<Record<string, unknown>>({});

  // Preview iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Pre-select company if companyId in URL
  useEffect(() => {
    if (preselectedCompanyId) {
      fetchCompanyById(preselectedCompanyId);
    }
  }, [preselectedCompanyId]);

  // Load template when templateId is in URL (template-edit mode)
  useEffect(() => {
    if (!preselectedTemplateId) return;
    const loadTemplate = async () => {
      try {
        const res = await fetch(`/api/layout-templates/${preselectedTemplateId}`);
        const data = await res.json();
        if (!res.ok || !data.success) return;
        const tpl = data.data;
        setEditingTemplateId(tpl.id);
        setEditingTemplateName(tpl.name || 'Layout Template');
        setLayoutConfig(tpl.layoutConfig as LayoutConfig);
        // Pre-select the first assigned company so the preview iframe can load
        const assignedCompany = tpl.brandingSettings?.[0];
        if (assignedCompany?.company) {
          const c = assignedCompany.company;
          setSelectedCompany({
            id: c.id,
            tenantId: c.tenantId || c.id,
            name: c.name,
            brandCode: assignedCompany.brandCode || '',
            primaryColor: assignedCompany.primaryColor || '#2563eb',
            secondaryColor: assignedCompany.secondaryColor || '#ffffff',
            logoUrl: assignedCompany.logoUrl || '',
          });
        }
        // Jump straight to Blocks tab — no need for Setup when template is pre-loaded
        setLeftPanelTab('blocks');
      } catch (err) {
        console.error('Failed to load template for editing:', err);
      }
    };
    loadTemplate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectedTemplateId]);

  // Load existing layout when company is selected (only in company-layout mode)
  useEffect(() => {
    if (selectedCompany?.id && !editingTemplateId) {
      loadExistingLayout(selectedCompany.id);
    }
  }, [selectedCompany?.id, editingTemplateId]);

  const fetchCompanyById = async (id: string) => {
    try {
      const res = await fetch('/api/settings/companies');
      const data = await res.json();
      const companyList = Array.isArray(data) ? data : (data.data || []);
      if (companyList.length > 0) {
        const match = companyList.find((c: Record<string, string>) => c.id === id);
        if (match) {
          setSelectedCompany({
            id: match.id,
            tenantId: match.companyId || match.tenantId,
            name: match.companyName || match.name,
            brandCode: match.brandCode,
            primaryColor: match.primaryColor,
            secondaryColor: match.secondaryColor,
            tertiaryColor: match.tertiaryColor,
            logoUrl: match.logoUrl,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching company:', err);
    }
  };

  const loadExistingLayout = async (companyId: string) => {
    try {
      const res = await fetch(`/api/layouts/${companyId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const loadedConfig = data.data.layoutConfig;
          setLayoutConfig(loadedConfig);
          setReferenceUrl(data.data.referenceUrl || '');
          setDescription(data.data.description || '');
          setReferenceFilePath(data.data.referenceFile || '');
          // Restore saved banner/footer image paths from branding globalStyles
          const gs = loadedConfig?.globalStyles || {};
          if (gs.heroBannerUrl) setBannerImagePath(gs.heroBannerUrl);
          if (gs.footerImageUrl) setFooterImagePath(gs.footerImageUrl);

          // Detect legacy single-block layout (pre-split) and warn the user
          const sectionCount = loadedConfig?.sections?.length || 0;
          const isLegacy = sectionCount === 1 && loadedConfig?.sections?.[0]?.id === 'grace-document';

          if (isLegacy) {
            setStatusMessage('Layout loaded — using legacy single-block format. Click "Upgrade to multi-block" to enable per-block editing.');
          } else {
            setStatusMessage(`Layout loaded — ${sectionCount} editable block${sectionCount !== 1 ? 's' : ''}. Switch to the Blocks tab to edit copy.`);
            // Auto-switch to Blocks tab so editing is immediately visible
            setLeftPanelTab('blocks');
          }
          addAssistantMessage('I loaded the existing custom layout for this company. Switch to the **Blocks** tab to edit individual sections, or ask me to modify the layout.');
        }
      }
    } catch {
      // No existing layout — that's fine
    }
  };

  /** Upgrade a legacy single-block layout to the current multi-block grace-static format */
  const handleUpgradeToMultiBlock = async () => {
    if (!selectedCompany) return;
    const { GRACE_STATIC_LAYOUT } = await import('@/lib/layouts/grace-static');
    setLayoutConfig(GRACE_STATIC_LAYOUT as unknown as LayoutConfig);
    setLeftPanelTab('blocks');
    setStatusMessage('Upgraded to 10-block layout. Review the blocks then click "Approve & Save" to apply.');
    setSaved(false);
  };

  // ---- Drag and Drop Handlers ----
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFileUpload(file);
    }
  };

  // ---- File Upload ----
  const uploadFileAndGetUrl = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/layouts/upload', {
      method: 'POST',
      body: formData,
    });

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('Non-JSON response from upload:', text.substring(0, 500));
      throw new Error(`Upload failed: Server returned ${res.status}. Check console for details.`);
    }

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Upload failed');
    }
    return data.url;
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadFileAndGetUrl(file);
      setReferenceFilePath(url);
      setReferenceFile(file);
      setStatusMessage(`File "${file.name}" uploaded successfully`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      console.error('Upload error:', err);
      setError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const handleBannerImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Banner image must be a PNG, JPG, or WebP image');
      return;
    }
    setUploadingBanner(true);
    setError(null);
    try {
      const url = await uploadFileAndGetUrl(file);
      setBannerImagePath(url);
      setBannerImageFile(file);
      setStatusMessage(`Banner image "${file.name}" uploaded successfully`);
      // Immediately inject into live preview
      setLayoutConfig((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          globalStyles: { ...(prev.globalStyles || {}), heroBannerUrl: url },
        };
        updatePreview(updated);
        return updated;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Banner upload failed';
      console.error('Banner upload error:', err);
      setError(errorMsg);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleFooterImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Footer image must be a PNG, JPG, or WebP image');
      return;
    }
    setUploadingFooter(true);
    setError(null);
    try {
      const url = await uploadFileAndGetUrl(file);
      setFooterImagePath(url);
      setFooterImageFile(file);
      setStatusMessage(`Footer image "${file.name}" uploaded successfully`);
      // Immediately inject into live preview
      setLayoutConfig((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          globalStyles: { ...(prev.globalStyles || {}), footerImageUrl: url },
        };
        updatePreview(updated);
        return updated;
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Footer upload failed';
      console.error('Footer upload error:', err);
      setError(errorMsg);
    } finally {
      setUploadingFooter(false);
    }
  };

  // ---- Generate Layout ----
  const handleGenerate = async () => {
    if (!selectedCompany) {
      setError('Please select a company first');
      return;
    }
    if (!description.trim() && !referenceUrl.trim() && !referenceFilePath) {
      setError('Please upload a reference file, enter a description, or provide a reference URL');
      return;
    }

    setGenerating(true);
    setError(null);
    setSaved(false);

    try {
      const conversationHistory = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/layouts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          companyName: selectedCompany.name,
          brandCode: selectedCompany.brandCode,
          primaryColor: selectedCompany.primaryColor || '#2563eb',
          secondaryColor: selectedCompany.secondaryColor || '#ffffff',
          tertiaryColor: selectedCompany.tertiaryColor || undefined,
          logoUrl: selectedCompany.logoUrl,
          bannerImageUrl: bannerImagePath || undefined,
          footerImageUrl: footerImagePath || undefined,
          referenceUrl: referenceUrl || undefined,
          referenceFilePath: referenceFilePath || undefined,
          description,
          conversationHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        const errorMsg = data.error || 'Generation failed';
        console.error('[Layout Builder] Generation failed:', data);
        
        // Show detailed error if available
        if (data.details) {
          console.error('[Layout Builder] Error details:', data.details);
        }
        
        throw new Error(errorMsg);
      }

      setLayoutConfig(data.data);
      setChatOpen(true);
      // Switch to Blocks tab so editing is immediately accessible
      setLeftPanelTab('blocks');
      
      // Show warnings in chat if URL capture failed
      if (data.warnings && data.warnings.length > 0) {
        addAssistantMessage(data.message);
      } else {
        addAssistantMessage(data.message || 'Layout generated! Switch to the **Blocks** tab (already active) to edit copy and add placeholders. Use the **Placeholders** tab to see all available data fields.');
      }
      
      updatePreview(data.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Generation failed';
      console.error('[Layout Builder] Error:', err);
      setError(errorMsg);
      
      // Add error to chat as well
      addAssistantMessage(`Sorry, I encountered an error: ${errorMsg}`);
    } finally {
      setGenerating(false);
    }
  };

  // ---- Refine Layout (via chat) ----
  const handleRefine = async (feedback: string) => {
    if (!layoutConfig || !selectedCompany) return;

    setChatLoading(true);
    setError(null);

    try {
      const conversationHistory = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/layouts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'refine',
          currentConfig: layoutConfig,
          feedback,
          companyName: selectedCompany.name,
          primaryColor: selectedCompany.primaryColor || '#2563eb',
          secondaryColor: selectedCompany.secondaryColor || '#ffffff',
          conversationHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Refinement failed');
      }

      setLayoutConfig(data.data);
      setSaved(false);
      addAssistantMessage(data.message || 'Layout updated! Check the preview.');
      updatePreview(data.data);
    } catch (err) {
      addAssistantMessage(`Sorry, I had trouble updating the layout: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setChatLoading(false);
    }
  };

  // ---- Chat (non-layout-modifying) ----
  const handleChat = async (message: string) => {
    setChatLoading(true);
    try {
      const conversationHistory = chatMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/layouts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          message,
          companyName: selectedCompany?.name || 'Unknown',
          conversationHistory,
        }),
      });

      const data = await res.json();
      if (data.success && data.message) {
        addAssistantMessage(data.message);
      } else {
        addAssistantMessage('Sorry, I had trouble processing that. Please try again.');
      }
    } catch {
      addAssistantMessage('Sorry, I encountered an error. Please try again.');
    } finally {
      setChatLoading(false);
    }
  };

  // ---- Send Chat Message ----
  const handleSendMessage = async (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || chatLoading) return;

    addUserMessage(trimmedMessage);

    // Determine if this is a layout modification request or general chat
    const isModification = layoutConfig && /change|update|move|make|add|remove|hide|show|swap|replace|bigger|smaller|different|modify|adjust|set|use/i.test(trimmedMessage);

    if (isModification) {
      await handleRefine(trimmedMessage);
    } else {
      await handleChat(trimmedMessage);
    }
  };

  // ---- Save Layout ----
  const handleSave = async () => {
    if (!layoutConfig) return;

    setSaving(true);
    setError(null);

    try {
      // Template-edit mode: save back to the layout template
      if (editingTemplateId) {
        const res = await fetch(`/api/layout-templates/${editingTemplateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ layoutConfig }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Save failed');
        setSaved(true);
        setStatusMessage(`Template "${editingTemplateName}" saved. All companies using this template will see the updated layout.`);
        addAssistantMessage(`Template "${editingTemplateName}" saved successfully.`);
        return;
      }

      // Company-layout mode: save to the company's custom layout
      if (!selectedCompany) return;
      const res = await fetch(`/api/layouts/${selectedCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layoutConfig,
          referenceUrl: referenceUrl || null,
          referenceFile: referenceFilePath || null,
          description: description || null,
          isActive: true,
          heroBannerUrl: bannerImagePath || null,
          footerImageUrl: footerImagePath || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Save failed');
      }

      setSaved(true);
      setStatusMessage('Layout saved and activated! All quotes for this company will now use this layout.');
      addAssistantMessage('Layout saved successfully! All future quotes for this company will use this custom layout.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ---- Preview ----
  const updatePreview = (config: LayoutConfig) => {
    // Send the layout config to the preview iframe via postMessage
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'LAYOUT_PREVIEW_UPDATE', config },
        '*',
      );
    }
  };

  // Whenever layoutConfig changes, ensure the iframe receives it.
  // This is critical because on initial generation the iframe is conditionally
  // rendered and doesn't exist yet when updatePreview() is first called.
  useEffect(() => {
    if (!layoutConfig) return;

    const sendToIframe = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'LAYOUT_PREVIEW_UPDATE', config: layoutConfig },
          '*',
        );
      }
    };

    // Immediate attempt (works for refinement when iframe is already loaded)
    sendToIframe();

    // Delayed attempts for initial generation: the iframe was just created
    // and needs time to load the page and set up its message listener
    const t1 = setTimeout(sendToIframe, 500);
    const t2 = setTimeout(sendToIframe, 1500);
    const t3 = setTimeout(sendToIframe, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [layoutConfig]);

  // Listen for "ready" signal from the iframe (most reliable mechanism)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LAYOUT_PREVIEW_READY' && layoutConfig) {
        updatePreview(layoutConfig);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [layoutConfig]);

  // ---- Helpers ----
  const addUserMessage = (content: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      },
    ]);
  };

  // ---- Placeholder copy ----
  const handleCopyPlaceholder = (key: string) => {
    navigator.clipboard.writeText(`{{${key}}}`);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const toggleCategory = (cat: PlaceholderCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // ---- Block drag-and-drop ----
  const handleDragStartBlock = (index: number) => setDraggingIndex(index);
  const handleDragOverBlock = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  const handleDropBlock = (dropIndex: number) => {
    if (draggingIndex === null || draggingIndex === dropIndex || !layoutConfig) return;
    const sections = [...(layoutConfig.sections || [])];
    const [moved] = sections.splice(draggingIndex, 1);
    sections.splice(dropIndex, 0, moved);
    const updated = { ...layoutConfig, sections };
    setLayoutConfig(updated);
    updatePreview(updated);
    setDraggingIndex(null);
    setDragOverIndex(null);
  };
  const handleDragEndBlock = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  // ---- Conditional visibility ----

  /** Fields available for block conditions — mirrors QuotePageData dot-paths */
  const CONDITION_FIELDS = [
    { value: 'job.moveType',          label: 'Move Type',           example: 'EX, LR, IM, ST' },
    { value: 'job.brandCode',         label: 'Brand Code',          example: 'MWB, GRC' },
    { value: 'job.branchCode',        label: 'Branch Code',         example: 'MEL, SYD' },
    { value: 'job.upliftCountry',     label: 'Origin Country',      example: 'Australia, NZ' },
    { value: 'job.deliveryCountry',   label: 'Destination Country', example: 'Australia, UK' },
    { value: 'job.upliftState',       label: 'Origin State',        example: 'VIC, NSW' },
    { value: 'job.deliveryState',     label: 'Destination State',   example: 'VIC, NSW' },
    { value: 'job.upliftCity',        label: 'Origin City',         example: 'Melbourne' },
    { value: 'job.deliveryCity',      label: 'Destination City',    example: 'Sydney' },
  ] as const;

  const CONDITION_OPERATORS = [
    { value: '==',         label: 'equals' },
    { value: '!=',         label: 'does not equal' },
    { value: 'contains',   label: 'contains' },
    { value: 'startsWith', label: 'starts with' },
    { value: 'endsWith',   label: 'ends with' },
    { value: 'isBlank',    label: 'is blank' },
    { value: 'isNotBlank', label: 'is not blank' },
  ] as const;

  const needsValue = (op: string) => op !== 'isBlank' && op !== 'isNotBlank';

  const openConditionEditor = (index: number) => {
    if (!layoutConfig) return;
    // If the editor is already open for this block, close it
    if (conditionEditorIndex === index) {
      setConditionEditorIndex(null);
      return;
    }
    const existing = layoutConfig.sections[index]?.condition;
    setConditionDraft(existing ?? { field: 'job.moveType', operator: '==', value: '' });
    setConditionEditorIndex(index);
  };

  const saveCondition = (index: number) => {
    if (!layoutConfig) return;
    const condition: SectionCondition = {
      field: conditionDraft.field,
      operator: conditionDraft.operator,
      value: needsValue(conditionDraft.operator) ? conditionDraft.value : undefined,
    };
    const sections = layoutConfig.sections.map((s, i) =>
      i === index ? { ...s, condition } : s
    );
    const updated = { ...layoutConfig, sections };
    setLayoutConfig(updated);
    updatePreview(updated);
    setConditionEditorIndex(null);
    const fieldLabel = CONDITION_FIELDS.find(f => f.value === condition.field)?.label ?? condition.field;
    const opLabel = CONDITION_OPERATORS.find(o => o.value === condition.operator)?.label ?? condition.operator;
    const summary = needsValue(condition.operator)
      ? `"${fieldLabel}" ${opLabel} "${condition.value}"`
      : `"${fieldLabel}" ${opLabel}`;
    setStatusMessage(`Condition set: show block when ${summary}.`);
    setSaved(false);
  };

  const clearCondition = (index: number) => {
    if (!layoutConfig) return;
    const sections = layoutConfig.sections.map((s, i) => {
      if (i !== index) return s;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { condition: _removed, ...rest } = s;
      return rest;
    });
    const updated = { ...layoutConfig, sections };
    setLayoutConfig(updated);
    updatePreview(updated);
    setConditionEditorIndex(null);
    setStatusMessage('Condition removed — block will always be shown.');
    setSaved(false);
  };

  // ---- Add / delete blocks ----

  /** Starter HTML templates for each addable block type */
  const BLOCK_TEMPLATES = {
    image: {
      label: 'Image',
      html: `<div style="padding:0 32px;margin-bottom:50px;">
  <div style="background:#ffffff;border:1px solid #e9e9e9;border-radius:20px;overflow:hidden;">
    <img src="{{branding.heroBannerUrl}}" alt="Image" style="width:100%;display:block;object-fit:cover;max-height:400px;" />
  </div>
</div>`,
    },
    html: {
      label: 'Custom HTML',
      html: `<div style="padding:0 32px;margin-bottom:50px;">
  <div style="background:#ffffff;border:1px solid #e9e9e9;border-radius:20px;padding:28px 24px;">
    <h3 style="color:{{branding.primaryColor}};font-size:22px;font-weight:700;margin:0 0 16px 0;">Block Title</h3>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Add your content here. Use the placeholders panel on the right to insert dynamic data.</p>
  </div>
</div>`,
    },
    text1col: {
      label: 'Text — 1 Column',
      html: `<div style="padding:0 32px;margin-bottom:50px;">
  <div style="background:#ffffff;border:1px solid #e9e9e9;border-radius:20px;padding:28px 24px;">
    <h3 style="color:{{branding.primaryColor}};font-size:22px;font-weight:700;margin:0 0 12px 0;">Section Heading</h3>
    <p style="font-size:14px;color:#555;line-height:1.7;margin:0;">Your paragraph text goes here. Replace this with your own copy or insert a placeholder like {{customerName}}.</p>
  </div>
</div>`,
    },
    text2col: {
      label: 'Text — 2 Columns',
      html: `<div style="padding:0 32px;margin-bottom:50px;">
  <div style="background:#ffffff;border:1px solid #e9e9e9;border-radius:20px;padding:28px 24px;">
    <h3 style="color:{{branding.primaryColor}};font-size:22px;font-weight:700;margin:0 0 20px 0;">Section Heading</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
      <div>
        <h4 style="font-size:15px;font-weight:700;color:#222;margin:0 0 8px 0;">Column 1 Title</h4>
        <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">Column 1 content goes here. Replace this with your copy.</p>
      </div>
      <div>
        <h4 style="font-size:15px;font-weight:700;color:#222;margin:0 0 8px 0;">Column 2 Title</h4>
        <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">Column 2 content goes here. Replace this with your copy.</p>
      </div>
    </div>
  </div>
</div>`,
    },
    text3col: {
      label: 'Text — 3 Columns',
      html: `<div style="padding:0 32px;margin-bottom:50px;">
  <div style="background:#ffffff;border:1px solid #e9e9e9;border-radius:20px;padding:28px 24px;">
    <h3 style="color:{{branding.primaryColor}};font-size:22px;font-weight:700;margin:0 0 20px 0;">Section Heading</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">
      <div>
        <h4 style="font-size:14px;font-weight:700;color:#222;margin:0 0 8px 0;">Column 1</h4>
        <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">Column 1 content.</p>
      </div>
      <div>
        <h4 style="font-size:14px;font-weight:700;color:#222;margin:0 0 8px 0;">Column 2</h4>
        <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">Column 2 content.</p>
      </div>
      <div>
        <h4 style="font-size:14px;font-weight:700;color:#222;margin:0 0 8px 0;">Column 3</h4>
        <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">Column 3 content.</p>
      </div>
    </div>
  </div>
</div>`,
    },
  } as const;

  type BlockTemplateKey = keyof typeof BLOCK_TEMPLATES;

  const handleAddBlock = (templateKey: BlockTemplateKey) => {
    if (!layoutConfig) return;
    const tmpl = BLOCK_TEMPLATES[templateKey];
    const uid = `custom-${templateKey}-${Date.now()}`;
    const newSection = {
      id: uid,
      label: tmpl.label,
      type: 'custom_html' as const,
      visible: true,
      html: tmpl.html,
    };
    const updated = { ...layoutConfig, sections: [...layoutConfig.sections, newSection] };
    setLayoutConfig(updated);
    updatePreview(updated);
    setShowAddBlockModal(false);
    setStatusMessage(`"${tmpl.label}" block added at the bottom. Drag to reorder, then click the pencil to customise.`);
    setSaved(false);
  };

  const handleDeleteBlock = (index: number) => {
    if (!layoutConfig) return;
    const label = layoutConfig.sections[index]?.label || `Block ${index + 1}`;
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    const sections = layoutConfig.sections.filter((_, i) => i !== index);
    const updated = { ...layoutConfig, sections };
    setLayoutConfig(updated);
    updatePreview(updated);
    setStatusMessage(`"${label}" deleted.`);
    setSaved(false);
  };

  const handleDuplicateBlock = (index: number) => {
    if (!layoutConfig) return;
    const original = layoutConfig.sections[index];
    const duplicate = {
      ...original,
      id: `${original.id}-copy-${Date.now()}`,
      label: `${original.label || original.id} (copy)`,
    };
    const sections = [
      ...layoutConfig.sections.slice(0, index + 1),
      duplicate,
      ...layoutConfig.sections.slice(index + 1),
    ];
    const updated = { ...layoutConfig, sections };
    setLayoutConfig(updated);
    updatePreview(updated);
    setStatusMessage(`"${duplicate.label}" duplicated — it appears directly below the original.`);
    setSaved(false);
  };

  const handleToggleSectionVisibility = (index: number) => {
    if (!layoutConfig) return;
    const sections = layoutConfig.sections.map((s, i) =>
      i === index ? { ...s, visible: s.visible === false ? true : false } : s
    );
    const updated = { ...layoutConfig, sections };
    setLayoutConfig(updated);
    updatePreview(updated);
  };

  const handleUpdateSectionConfig = (index: number, key: string, value: unknown) => {
    if (!layoutConfig) return;
    const sections = layoutConfig.sections.map((s, i) =>
      i === index ? { ...s, config: { ...(s.config as Record<string, unknown> || {}), [key]: value } } : s
    );
    const updated = { ...layoutConfig, sections };
    setLayoutConfig(updated);
    updatePreview(updated);
  };

  // ---- Block editor ----
  const openBlockEditor = (index: number) => {
    if (!layoutConfig) return;
    const section = layoutConfig.sections[index];
    const html = section.html || '';
    setEditingBlockIndex(index);
    setEditingBlockContent(html);
    setEditingBlockConfig((section.config as Record<string, unknown>) || {});
    // Run copy extractor
    const { fields, markedHtml: mHtml } = extractCopyFields(html);
    setCopyFields(fields);
    setMarkedHtml(mHtml);
    setShowHtmlEditor(false); // default: show copy fields
    setLeftPanelTab('blocks');
  };

  const closeBlockEditor = () => {
    setEditingBlockIndex(null);
    setEditingBlockContent('');
    setEditingBlockConfig({});
    setCopyFields([]);
    setMarkedHtml('');
  };

  /** Build the current HTML from either the HTML editor or the copy fields */
  const getCurrentBlockHtml = (): string => {
    if (showHtmlEditor) return editingBlockContent;
    return reconstructFromCopyFields(markedHtml, copyFields);
  };

  const saveBlockEdit = () => {
    if (editingBlockIndex === null || !layoutConfig) return;
    const finalHtml = getCurrentBlockHtml();
    const sections = layoutConfig.sections.map((s, i) =>
      i === editingBlockIndex
        ? { ...s, html: finalHtml, config: Object.keys(editingBlockConfig).length ? editingBlockConfig : s.config }
        : s
    );
    const updated = { ...layoutConfig, sections };
    setLayoutConfig(updated);
    // Keep local textarea in sync
    setEditingBlockContent(finalHtml);
    updatePreview(updated);
    closeBlockEditor();
    setStatusMessage('Block saved. Preview updated.');
  };

  /** Insert {{key}} at the current textarea cursor position */
  const insertPlaceholderInEditor = (key: string) => {
    const textarea = editBlockTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? editingBlockContent.length;
    const end = textarea.selectionEnd ?? start;
    const token = `{{${key}}}`;
    const before = editingBlockContent.slice(0, start);
    const after = editingBlockContent.slice(end);
    const newContent = before + token + after;
    setEditingBlockContent(newContent);
    // Restore focus and advance cursor past the inserted token
    setTimeout(() => {
      textarea.focus();
      const newPos = start + token.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  /**
   * Returns true when the block being edited has image max-height config keys
   * (either already set, or when the block label / id suggests it is a banner).
   */
  const editingBlockIsImage = (): boolean => {
    if (editingBlockIndex === null || !layoutConfig) return false;
    const section = layoutConfig.sections[editingBlockIndex];
    const hasKeys = 'desktopMaxHeight' in editingBlockConfig;
    const nameHint = /banner|footer.?image|hero/i.test(
      `${section.label || ''} ${section.id || ''}`,
    );
    return hasKeys || nameHint;
  };

  const addAssistantMessage = (content: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-bot`,
        role: 'assistant',
        content,
        timestamp: new Date(),
      },
    ]);
  };

  // ---- Auth guard ----
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full">
          <LoginForm />
        </div>
      </div>
    );
  }

  // ---- Render ----
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <a
            href="/settings"
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Settings
          </a>
          <span className="text-gray-300">|</span>
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            AI Layout Builder
          </h1>
          {editingTemplateId && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
              <LayoutTemplate className="w-3 h-3" />
              Template: {editingTemplateName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/settings/layout-builder-debug"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 transition-colors"
            title="Debug URL capture (see what screenshot AI receives)"
          >
            <Eye className="w-4 h-4" />
            Debug
          </a>
          <a
            href="/settings/layout-builder-diagnostics"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 transition-colors"
            title="Check system dependencies"
          >
            <AlertCircle className="w-4 h-4" />
            Diagnostics
          </a>
          <a
            href="/docs/ai-layout-guide"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
            title="View usage guide"
          >
            <HelpCircle className="w-4 h-4" />
            Help
          </a>
          {layoutConfig && (
            <>
              <button
                onClick={() => updatePreview(layoutConfig)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Preview
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saved ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {saved ? 'Saved' : 'Approve & Save'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status / Error Bar */}
      {(error || statusMessage) && (
        <div className={`px-4 py-2 text-sm flex-shrink-0 ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          <div className="flex items-center gap-2 flex-wrap">
            {error ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
            <span>{error || statusMessage}</span>
            {/* Legacy single-block upgrade CTA */}
            {!error && statusMessage?.includes('legacy single-block') && (
              <button
                onClick={handleUpgradeToMultiBlock}
                className="ml-2 px-2.5 py-0.5 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 transition-colors"
              >
                Upgrade to multi-block
              </button>
            )}
            <button
              onClick={() => { setError(null); setStatusMessage(null); }}
              className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Tabbed */}
        <div className="w-[420px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-gray-200 flex-shrink-0">
            {[
              { id: 'setup', label: 'Setup', icon: <Wand2 className="w-3.5 h-3.5" /> },
              { id: 'blocks', label: 'Blocks', icon: <Layers className="w-3.5 h-3.5" /> },
              { id: 'placeholders', label: 'Placeholders', icon: <Tag className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setLeftPanelTab(tab.id as 'setup' | 'blocks' | 'placeholders')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  leftPanelTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'blocks' && layoutConfig && (
                  <span className="ml-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px]">
                    {layoutConfig.sections?.length || 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── SETUP TAB ── */}
          {leftPanelTab === 'setup' && (
          <div className="p-4 overflow-y-auto flex-1">
            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Layout Request</h2>

            {/* If a layout is already loaded, prompt them to switch to Blocks */}
            {layoutConfig && layoutConfig.sections?.length > 0 && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-amber-600 text-sm">💡</span>
                  <div className="text-xs text-amber-800">
                    <strong>Layout loaded ({layoutConfig.sections.length} blocks).</strong> To edit copy or add placeholders, switch to the{' '}
                    <button
                      onClick={() => setLeftPanelTab('blocks')}
                      className="underline font-semibold hover:text-amber-900"
                    >
                      Blocks tab
                    </button>
                    {' '}and click the pencil icon on any block.
                  </div>
                </div>
              </div>
            )}

            {/* Best Results Tip */}
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <strong>Best approach for matching an existing layout:</strong>
                  <ol className="list-decimal list-inside mt-1 space-y-0.5">
                    <li>Open the quote page in your browser</li>
                    <li>Print to PDF (Ctrl+P → Save as PDF)</li>
                    <li>Upload the PDF below using <strong>Reference File</strong></li>
                    <li>Add a description with key details (colors, sections)</li>
                  </ol>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Template-mode callout — company picker is for preview only */}
              {editingTemplateId && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <LayoutTemplate className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-purple-800">
                      <strong>Editing template: {editingTemplateName}</strong>
                      <p className="mt-0.5 text-purple-700">Changes are saved to the template and applied to all assigned companies. Select a company below only to load a live preview.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Company Dropdown */}
              <CompanySearchDropdown
                value={selectedCompany}
                onChange={setSelectedCompany}
                disabled={generating}
              />

              {/* Reference File Upload (PRIMARY) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference File <span className="text-blue-600 font-normal">(Recommended)</span>
                </label>
                {referenceFile || referenceFilePath ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {referenceFile?.name || referenceFilePath.split('/').pop()}
                    </span>
                    <button
                      onClick={() => { setReferenceFile(null); setReferenceFilePath(''); }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-blue-500 bg-blue-100'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                    } ${uploading ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    <input
                      type="file"
                      accept=".pdf,.html,.htm,.zip,image/png,image/jpeg,image/webp"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                      disabled={uploading || generating}
                    />
                    <label htmlFor="file-upload" className="flex items-center gap-2 cursor-pointer flex-1">
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Upload className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500">
                        {isDragging ? 'Drop file here' : 'Upload or drag & drop PDF/HTML/ZIP/image'}
                      </span>
                    </label>
                  </div>
                )}
              </div>

              {/* Reference URL (Secondary option) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Header Banner Image <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                {bannerImageFile || bannerImagePath ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {bannerImageFile?.name || bannerImagePath.split('/').pop()}
                    </span>
                    <button
                      onClick={() => { setBannerImageFile(null); setBannerImagePath(''); }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg ${uploadingBanner ? 'opacity-50 cursor-wait' : ''}`}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => e.target.files?.[0] && handleBannerImageUpload(e.target.files[0])}
                      className="hidden"
                      id="banner-image-upload"
                      disabled={uploadingBanner || generating}
                    />
                    <label htmlFor="banner-image-upload" className="flex items-center gap-2 cursor-pointer flex-1">
                      {uploadingBanner ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Upload className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500">Upload header banner image</span>
                    </label>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Footer Image <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                {footerImageFile || footerImagePath ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {footerImageFile?.name || footerImagePath.split('/').pop()}
                    </span>
                    <button
                      onClick={() => { setFooterImageFile(null); setFooterImagePath(''); }}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg ${uploadingFooter ? 'opacity-50 cursor-wait' : ''}`}>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => e.target.files?.[0] && handleFooterImageUpload(e.target.files[0])}
                      className="hidden"
                      id="footer-image-upload"
                      disabled={uploadingFooter || generating}
                    />
                    <label htmlFor="footer-image-upload" className="flex items-center gap-2 cursor-pointer flex-1">
                      {uploadingFooter ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Upload className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm text-gray-500">Upload footer image</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Reference URL (Secondary option) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference URL <span className="text-gray-400 font-normal">(Alternative to file upload)</span>
                </label>
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://example.com/quote-sample"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={generating}
                />
                <p className="text-xs text-gray-400 mt-0.5">
                  The server will try to screenshot this URL. May fail if the URL requires authentication or has expired tokens. PDF upload is more reliable.
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                  {(referenceUrl || referenceFilePath) && <span className="text-amber-600 ml-1">(Recommended)</span>}
                  {!referenceUrl && !referenceFilePath && <span className="text-red-600 ml-1">*</span>}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    referenceFilePath
                      ? "Describe key details from your uploaded reference: header design, section order, colors (hex codes), styling..."
                      : referenceUrl
                        ? "Describe the reference layout in detail (important if URL can't be accessed by server): header design (colors, gradients), section order, styling..."
                        : "Describe the desired layout, style, and any specific requirements..."
                  }
                  rows={(referenceUrl || referenceFilePath) ? 5 : 3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={generating}
                />
                {(referenceUrl || referenceFilePath) && (
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ <strong>Important:</strong> Always include a description with key details (header colors, section order, styling) to get the best results.
                  </p>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedCompany || (!description.trim() && !referenceUrl.trim() && !referenceFilePath)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Layout...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Generate Layout
                  </>
                )}
              </button>
            </div>
          </div>
          )} {/* end SETUP TAB */}

          {/* ── BLOCKS TAB ── */}
          {leftPanelTab === 'blocks' && (

          /* ── BLOCK EDITOR (full-panel takeover) ── */
          editingBlockIndex !== null && layoutConfig ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Editor header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
              <button
                onClick={closeBlockEditor}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
              <span className="text-gray-300">|</span>
              <span className="text-sm font-semibold text-gray-800 truncate flex-1">
                {layoutConfig.sections[editingBlockIndex]?.label ||
                 layoutConfig.sections[editingBlockIndex]?.id ||
                 `Block ${editingBlockIndex + 1}`}
              </span>
              {/* HTML / Copy toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                <button
                  onClick={() => setShowHtmlEditor(false)}
                  className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${!showHtmlEditor ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Copy Fields
                </button>
                <button
                  onClick={() => {
                    // Sync HTML editor with latest copy fields before switching
                    if (!showHtmlEditor) setEditingBlockContent(reconstructFromCopyFields(markedHtml, copyFields));
                    setShowHtmlEditor(true);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-semibold transition-colors ${showHtmlEditor ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  HTML
                </button>
              </div>
            </div>

            {/* ── COPY FIELDS VIEW ── */}
            {!showHtmlEditor && (
              <div className="flex flex-1 overflow-hidden">
                {/* Fields */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {copyFields.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No editable text found.</p>
                      <p className="text-xs mt-1">Switch to HTML view to edit raw markup.</p>
                    </div>
                  ) : copyFields.map((field) => {
                    // Detect if this field holds a pure placeholder value like {{quoteDate}}
                    const isPlaceholder = /^\s*\{\{[^}]+\}\}\s*$/.test(field.value);
                    return (
                      <div key={field.id}>
                        <label className={`block text-xs font-medium mb-1 ${isPlaceholder ? 'text-blue-600' : 'text-gray-600'}`}>
                          {field.label}
                          {isPlaceholder && (
                            <span className="ml-1.5 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-semibold uppercase tracking-wide">dynamic</span>
                          )}
                        </label>
                        <textarea
                          value={field.value}
                          onChange={(e) => {
                            const updated = copyFields.map((f) =>
                              f.id === field.id ? { ...f, value: e.target.value } : f
                            );
                            setCopyFields(updated);
                          }}
                          rows={field.value.length > 120 ? 4 : 2}
                          className={`w-full px-2 py-1.5 text-xs rounded focus:outline-none focus:ring-1 resize-none ${
                            isPlaceholder
                              ? 'border border-blue-200 bg-blue-50 font-mono text-blue-700 focus:ring-blue-400'
                              : 'border border-gray-300 focus:ring-blue-400'
                          }`}
                          placeholder={isPlaceholder ? 'Enter a placeholder e.g. {{quoteDate}}' : undefined}
                        />
                        {isPlaceholder && (
                          <p className="text-[9px] text-blue-500 mt-0.5">Dynamic data — change the placeholder key from the right panel</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Placeholder picker */}
                <div className="w-40 flex-shrink-0 overflow-y-auto bg-gray-50 border-l border-gray-200">
                  <div className="px-2 py-2 border-b border-gray-200 sticky top-0 bg-gray-50">
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide">Insert</p>
                    <p className="text-[9px] text-gray-400">Click field first, then placeholder</p>
                  </div>
                  {PLACEHOLDER_CATEGORIES.map((category) => {
                    const items = PLACEHOLDER_REGISTRY.filter((p) => p.category === category);
                    const isExpanded = expandedCategories.has(category);
                    return (
                      <div key={category}>
                        <button
                          onClick={() => toggleCategory(category)}
                          className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-100 hover:bg-gray-200 transition-colors text-left"
                        >
                          <span className="text-[9px] font-semibold text-gray-600 uppercase">{category}</span>
                          {isExpanded ? <ChevronDown className="w-2.5 h-2.5 text-gray-400" /> : <ChevronRight className="w-2.5 h-2.5 text-gray-400" />}
                        </button>
                        {isExpanded && items.map((p) => (
                          <button
                            key={p.key}
                            onClick={() => handleCopyPlaceholder(p.key)}
                            title={`Copy {{${p.key}}} to clipboard`}
                            className="w-full text-left px-2 py-1 hover:bg-blue-50 transition-colors border-t border-gray-50"
                          >
                            <div className="text-[9px] font-mono text-blue-700 truncate">{`{{${p.key}}}`}</div>
                            <div className="text-[9px] text-gray-400 truncate">{p.label}</div>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── HTML EDITOR VIEW ── */}
            {showHtmlEditor && (
              <div className="flex flex-1 overflow-hidden">
                <div className="flex flex-col flex-1 overflow-hidden border-r border-gray-200">
                  <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex-shrink-0">
                    <p className="text-xs text-amber-700"><strong>Developer view</strong> — editing raw HTML. Click a placeholder on the right to insert at cursor.</p>
                  </div>
                  <textarea
                    ref={editBlockTextareaRef}
                    value={editingBlockContent}
                    onChange={(e) => setEditingBlockContent(e.target.value)}
                    className="flex-1 w-full p-3 font-mono text-xs text-gray-800 bg-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                    spellCheck={false}
                  />
                </div>
                <div className="w-44 flex-shrink-0 overflow-y-auto bg-white">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 sticky top-0">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Placeholders</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Click to insert</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {PLACEHOLDER_CATEGORIES.map((category) => {
                      const items = PLACEHOLDER_REGISTRY.filter((p) => p.category === category);
                      const isExpanded = expandedCategories.has(category);
                      return (
                        <div key={category}>
                          <button
                            onClick={() => toggleCategory(category)}
                            className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                          >
                            <span className="text-[10px] font-semibold text-gray-600 uppercase">{category}</span>
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                          </button>
                          {isExpanded && items.map((p) => (
                            <button
                              key={p.key}
                              onClick={() => insertPlaceholderInEditor(p.key)}
                              title={p.description || p.label}
                              className="w-full text-left px-3 py-1.5 hover:bg-blue-50 group transition-colors"
                            >
                              <div className="text-[10px] font-mono text-blue-700 truncate group-hover:text-blue-800">{`{{${p.key}}}`}</div>
                              <div className="text-[10px] text-gray-400 truncate">{p.label}</div>
                            </button>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── IMAGE HEIGHTS PANEL (shown for banner / hero / footer-image blocks) ── */}
            {editingBlockIsImage() && (
              <div className="border-t border-gray-200 bg-amber-50 px-4 py-3 flex-shrink-0">
                <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m3 9 4-4 4 4 4-6 4 6"/></svg>
                  Image max-height
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: 'desktopMaxHeight', label: 'Desktop', default: 500 },
                    { key: 'tabletMaxHeight',  label: 'Tablet',  default: 350 },
                    { key: 'mobileMaxHeight',  label: 'Mobile',  default: 250 },
                  ] as const).map(({ key, label, default: def }) => (
                    <div key={key}>
                      <label className="block text-[9px] text-amber-700 font-medium mb-0.5">{label} (px)</label>
                      <input
                        type="number"
                        min={50}
                        max={1200}
                        value={String(editingBlockConfig[key] ?? def)}
                        onChange={(e) =>
                          setEditingBlockConfig((prev) => ({
                            ...prev,
                            [key]: Number(e.target.value) || def,
                          }))
                        }
                        className="w-full px-2 py-1 text-xs border border-amber-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-amber-600 mt-1.5">
                  Controls <code className="bg-amber-100 px-0.5 rounded">{"{{config.desktopMaxHeight}}"}</code> etc. in the HTML template.
                </p>
              </div>
            )}

            {/* Editor footer: Save / Cancel */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white flex-shrink-0">
              <button
                onClick={saveBlockEdit}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save Block
              </button>
              <button
                onClick={closeBlockEditor}
                className="px-3 py-2 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <span className="ml-auto text-[10px] text-gray-400">Preview updates on save</span>
            </div>
          </div>

          ) : (

          /* ── BLOCK LIST ── */
          <div className="p-4 overflow-y-auto flex-1">
            <h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Block Order
            </h2>
            <p className="text-xs text-gray-500 mb-3">Drag to reorder · eye icon to show/hide · pencil to edit copy.</p>

            {/* How to edit hint */}
            {layoutConfig && layoutConfig.sections?.length > 0 && (
              <div className="mb-4 p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-[11px] text-blue-800 space-y-1.5">
                  <p className="font-semibold">How to use:</p>
                  <p className="flex items-start gap-1">
                    <GripVertical className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span><strong>Drag</strong> the grip handle to reorder blocks</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <Pencil className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span><strong>Click the pencil</strong> on any block to edit copy or add placeholders like <code className="bg-blue-100 px-0.5 rounded">{"{{customer_name}}"}</code></span>
                  </p>
                  <p className="flex items-start gap-1">
                    <Eye className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                    <span><strong>Eye icon</strong> to show/hide · <CopyPlus className="w-3 h-3 inline text-green-500" /> to duplicate · <Trash2 className="w-3 h-3 inline text-red-400" /> to delete</span>
                  </p>
                  <p className="flex items-start gap-1">
                    <Filter className="w-3 h-3 mt-0.5 flex-shrink-0 text-amber-500" />
                    <span><strong>Filter icon</strong> to set a <strong>conditional visibility rule</strong> — e.g. only show when Move Type = EX</span>
                  </p>
                </div>
              </div>
            )}

            {!layoutConfig || !layoutConfig.sections?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                <Layers className="w-10 h-10 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No layout loaded</p>
                <p className="text-xs mt-1">Generate or load a layout first.</p>
                <button
                  onClick={() => setLeftPanelTab('setup')}
                  className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Go to Setup
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {layoutConfig.sections.map((section, index) => {
                  const isHidden = section.visible === false;
                  const isDraggingThis = draggingIndex === index;
                  const isOver = dragOverIndex === index && draggingIndex !== index;
                  const label = section.label || section.id || section.component || `Section ${index + 1}`;
                  const typeTag = section.type === 'custom_html' ? 'HTML' : (section.component || section.type || 'block');
                  const isEditable = section.type === 'custom_html';

                  const hasCondition = !!section.condition;
                  const condEditorOpen = conditionEditorIndex === index;
                  const isAcceptanceForm = section.component === 'AcceptanceForm';
                  const formCfgOpen = formConfigEditorIndex === index;

                  return (
                    <div key={section.id || index} className="rounded-lg overflow-hidden">
                    <div
                      draggable
                      onDragStart={() => handleDragStartBlock(index)}
                      onDragOver={(e) => handleDragOverBlock(e, index)}
                      onDrop={() => handleDropBlock(index)}
                      onDragEnd={handleDragEndBlock}
                      className={`flex items-center gap-2 px-3 py-2.5 border transition-all select-none ${
                        isDraggingThis
                          ? 'opacity-40 border-blue-400 bg-blue-50'
                          : isOver
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : formCfgOpen
                              ? 'border-purple-300 bg-purple-50 border-b-0 rounded-t-lg'
                              : condEditorOpen
                              ? 'border-amber-300 bg-amber-50 border-b-0 rounded-t-lg'
                              : isHidden
                                ? 'border-gray-200 bg-gray-50 opacity-60 rounded-lg'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm rounded-lg'
                      }`}
                    >
                      {/* Drag handle */}
                      <GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0 cursor-grab active:cursor-grabbing" />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{label}</div>
                        <div className="text-xs text-gray-400">{typeTag}</div>
                      </div>

                      {/* Position badge */}
                      <span className="text-xs text-gray-400 font-mono w-5 text-center">{index + 1}</span>

                      {/* Edit button (custom_html only) */}
                      {isEditable && (
                        <button
                          onClick={() => openBlockEditor(index)}
                          title="Edit copy / add placeholders"
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}

                      {/* Configure fields button (AcceptanceForm only) */}
                      {isAcceptanceForm && (
                        <button
                          onClick={() => setFormConfigEditorIndex(formCfgOpen ? null : index)}
                          title="Configure form fields"
                          className={`p-1 rounded transition-colors ${
                            formCfgOpen
                              ? 'text-purple-600 bg-purple-100'
                              : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Visibility toggle */}
                      <button
                        onClick={() => handleToggleSectionVisibility(index)}
                        title={isHidden ? 'Show block' : 'Hide block'}
                        className={`p-1 rounded transition-colors ${
                          isHidden ? 'text-gray-300 hover:text-gray-500' : 'text-gray-500 hover:text-blue-600'
                        }`}
                      >
                        {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>

                      {/* Duplicate button */}
                      <button
                        onClick={() => handleDuplicateBlock(index)}
                        title="Duplicate block"
                        className="p-1 rounded text-gray-300 hover:text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <CopyPlus className="w-3.5 h-3.5" />
                      </button>

                      {/* Condition button */}
                      <button
                        onClick={() => openConditionEditor(index)}
                        title={hasCondition ? `Condition: ${section.condition?.field} ${section.condition?.operator} "${section.condition?.value ?? ''}"` : 'Add display condition'}
                        className={`relative p-1 rounded transition-colors ${
                          hasCondition
                            ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-gray-300 hover:text-amber-500 hover:bg-amber-50'
                        } ${condEditorOpen ? 'bg-amber-100 text-amber-600' : ''}`}
                      >
                        {hasCondition ? <Filter className="w-3.5 h-3.5" /> : <Filter className="w-3.5 h-3.5" />}
                        {hasCondition && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
                        )}
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteBlock(index)}
                        title="Delete block"
                        className="p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* ── Inline acceptance form field config panel ── */}
                    {formCfgOpen && isAcceptanceForm && (() => {
                      const cfg = (section.config as Record<string, unknown>) || {};
                      const fields: { key: string; label: string }[] = [
                        { key: 'showSignatureName',       label: 'Signature Name' },
                        { key: 'showReloFromDate',        label: 'Relo From Date' },
                        { key: 'showInsuredValue',        label: 'Insured Value' },
                        { key: 'showPurchaseOrderNumber', label: 'Purchase Order Number' },
                        { key: 'showSpecialRequirements', label: 'Special Requirements' },
                      ];
                      return (
                        <div className="border border-purple-300 border-t-0 rounded-b-lg bg-purple-50 px-3 pt-3 pb-3 space-y-2">
                          <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1">
                            <Settings2 className="w-3 h-3" />
                            Acceptance form — visible fields
                          </p>
                          <div className="grid grid-cols-1 gap-1.5">
                            {fields.map(({ key, label }) => {
                              const isOn = cfg[key] !== false;
                              return (
                                <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                                  <button
                                    type="button"
                                    role="switch"
                                    aria-checked={isOn}
                                    onClick={() => handleUpdateSectionConfig(index, key, !isOn)}
                                    className={`relative inline-flex h-4 w-7 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                                      isOn ? 'bg-purple-500' : 'bg-gray-300'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                                        isOn ? 'translate-x-3' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                  <span className={`text-xs ${isOn ? 'text-purple-800 font-medium' : 'text-gray-400 line-through'}`}>
                                    {label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                          <p className="text-[9px] text-purple-500 pt-1">Changes apply immediately — save the layout to persist.</p>
                        </div>
                      );
                    })()}

                    {/* ── Inline condition editor panel ── */}
                    {condEditorOpen && (
                      <div className="border border-amber-300 border-t-0 rounded-b-lg bg-amber-50 px-3 pt-3 pb-3 space-y-2">
                        <p className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          Show this block only when…
                        </p>

                        {/* Field selector */}
                        <div>
                          <label className="block text-[10px] text-amber-700 mb-0.5 font-medium">Data field</label>
                          <select
                            value={conditionDraft.field}
                            onChange={(e) => setConditionDraft((d) => ({ ...d, field: e.target.value }))}
                            className="w-full text-xs px-2 py-1.5 border border-amber-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                          >
                            {CONDITION_FIELDS.map((f) => (
                              <option key={f.value} value={f.value}>
                                {f.label} ({f.value})
                              </option>
                            ))}
                          </select>
                          <p className="text-[9px] text-amber-500 mt-0.5">
                            e.g. {CONDITION_FIELDS.find(f => f.value === conditionDraft.field)?.example}
                          </p>
                        </div>

                        {/* Operator selector */}
                        <div>
                          <label className="block text-[10px] text-amber-700 mb-0.5 font-medium">Operator</label>
                          <select
                            value={conditionDraft.operator}
                            onChange={(e) => setConditionDraft((d) => ({ ...d, operator: e.target.value as SectionCondition['operator'] }))}
                            className="w-full text-xs px-2 py-1.5 border border-amber-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                          >
                            {CONDITION_OPERATORS.map((op) => (
                              <option key={op.value} value={op.value}>{op.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Value input — hidden for isBlank / isNotBlank */}
                        {needsValue(conditionDraft.operator) && (
                          <div>
                            <label className="block text-[10px] text-amber-700 mb-0.5 font-medium">Value</label>
                            <input
                              type="text"
                              value={conditionDraft.value ?? ''}
                              onChange={(e) => setConditionDraft((d) => ({ ...d, value: e.target.value }))}
                              placeholder="e.g. EX"
                              className="w-full text-xs px-2 py-1.5 border border-amber-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                            />
                            <p className="text-[9px] text-amber-500 mt-0.5">Comparison is case-insensitive</p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => saveCondition(index)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors"
                          >
                            Apply
                          </button>
                          <button
                            onClick={() => setConditionEditorIndex(null)}
                            className="px-3 py-1.5 text-xs text-amber-700 hover:text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors"
                          >
                            Cancel
                          </button>
                          {hasCondition && (
                            <button
                              onClick={() => clearCondition(index)}
                              className="ml-auto flex items-center gap-1 px-2 py-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <FilterX className="w-3 h-3" />
                              Remove condition
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* + Add Block button */}
            {layoutConfig && (
              <button
                onClick={() => setShowAddBlockModal(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Block
              </button>
            )}
          </div>

          ))} {/* end BLOCKS TAB */}

          {/* ── ADD BLOCK MODAL ── */}
          {showAddBlockModal && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowAddBlockModal(false); }}
            >
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base font-bold text-gray-900">Add a Block</h2>
                  </div>
                  <button onClick={() => setShowAddBlockModal(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Block type grid */}
                <div className="p-5 space-y-4">

                  {/* Image */}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Media</p>
                  <button
                    onClick={() => handleAddBlock('image')}
                    className="w-full flex items-center gap-4 px-4 py-3.5 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">Image</div>
                      <div className="text-xs text-gray-400 mt-0.5">Full-width image with rounded card container</div>
                    </div>
                  </button>

                  {/* HTML */}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Developer</p>
                  <button
                    onClick={() => handleAddBlock('html')}
                    className="w-full flex items-center gap-4 px-4 py-3.5 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                      <Code2 className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-blue-700">Custom HTML</div>
                      <div className="text-xs text-gray-400 mt-0.5">Blank HTML block — full control over markup and styles</div>
                    </div>
                  </button>

                  {/* Text blocks */}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Text Blocks</p>
                  <div className="grid grid-cols-3 gap-3">
                    {/* 1 Column */}
                    <button
                      onClick={() => handleAddBlock('text1col')}
                      className="flex flex-col items-center gap-2.5 px-3 py-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Type className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-700">1 Column</div>
                        {/* Column layout preview */}
                        <div className="flex gap-1 justify-center mt-2">
                          <div className="w-10 h-4 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </button>

                    {/* 2 Columns */}
                    <button
                      onClick={() => handleAddBlock('text2col')}
                      className="flex flex-col items-center gap-2.5 px-3 py-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Columns className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-700">2 Columns</div>
                        <div className="flex gap-1 justify-center mt-2">
                          <div className="w-4 h-4 bg-gray-200 rounded" />
                          <div className="w-4 h-4 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </button>

                    {/* 3 Columns */}
                    <button
                      onClick={() => handleAddBlock('text3col')}
                      className="flex flex-col items-center gap-2.5 px-3 py-4 border border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <Columns className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-semibold text-gray-800 group-hover:text-blue-700">3 Columns</div>
                        <div className="flex gap-1 justify-center mt-2">
                          <div className="w-3 h-4 bg-gray-200 rounded" />
                          <div className="w-3 h-4 bg-gray-200 rounded" />
                          <div className="w-3 h-4 bg-gray-200 rounded" />
                        </div>
                      </div>
                    </button>
                  </div>

                </div>

                {/* Footer note */}
                <div className="px-5 pb-4">
                  <p className="text-xs text-gray-400 text-center">New block is added at the bottom — drag to reposition</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PLACEHOLDERS TAB ── */}
          {leftPanelTab === 'placeholders' && (
          <div className="p-4 overflow-y-auto flex-1">
            <h2 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-wide flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              Placeholders
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Click <Copy className="w-3 h-3 inline mx-0.5" /> to copy a placeholder. Paste it into any copy block in your HTML template.
            </p>

            <div className="space-y-2">
              {PLACEHOLDER_CATEGORIES.map((category) => {
                const items = PLACEHOLDER_REGISTRY.filter((p) => p.category === category);
                const isExpanded = expandedCategories.has(category);
                return (
                  <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Category header */}
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{items.length}</span>
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                          : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                        }
                      </div>
                    </button>

                    {/* Items */}
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {items.map((placeholder) => {
                          const isCopied = copiedKey === placeholder.key;
                          return (
                            <div
                              key={placeholder.key}
                              className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 group"
                            >
                              <div className="flex-1 min-w-0 mr-2">
                                <div className="text-xs font-mono text-blue-700 truncate">
                                  {`{{${placeholder.key}}}`}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{placeholder.label}</div>
                                {placeholder.description && (
                                  <div className="text-xs text-gray-400 italic truncate">{placeholder.description}</div>
                                )}
                              </div>
                              <button
                                onClick={() => handleCopyPlaceholder(placeholder.key)}
                                title={isCopied ? 'Copied!' : `Copy {{${placeholder.key}}}`}
                                className={`flex-shrink-0 p-1.5 rounded transition-all ${
                                  isCopied
                                    ? 'bg-green-100 text-green-600'
                                    : 'bg-gray-100 text-gray-500 opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-600'
                                }`}
                              >
                                {isCopied
                                  ? <Check className="w-3.5 h-3.5" />
                                  : <Copy className="w-3.5 h-3.5" />
                                }
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )} {/* end PLACEHOLDERS TAB */}

        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-200">
          {/* Preview header bar */}
          <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center gap-3 flex-shrink-0">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2 flex-shrink-0">
              <Eye className="w-4 h-4 text-blue-600" />
              Live Preview
            </h2>
            {/* URL bar */}
            <div className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={previewJobUrl}
                  onChange={(e) => setPreviewJobUrl(e.target.value)}
                  placeholder={selectedCompany
                    ? `/quote?jobId=111505&coId=${selectedCompany.tenantId || '12'}&preview=true  (default)`
                    : 'Paste a quote URL to preview with live data…'}
                  className="w-full pl-3 pr-8 py-1 text-xs border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-gray-600 placeholder:text-gray-400 placeholder:font-sans"
                />
                {previewJobUrl && (
                  <button
                    onClick={() => setPreviewJobUrl('')}
                    title="Clear — revert to default URL"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {previewJobUrl && (
                <span className="text-[10px] text-amber-600 font-medium flex-shrink-0">custom URL</span>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 overflow-hidden">
            {!layoutConfig ? (
              <div className="h-full flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                  <Eye className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">No Preview Yet</p>
                  <p className="text-sm mt-1">Fill in the form and generate a layout to see a preview here.</p>
                </div>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                src={
                  previewJobUrl.trim() ||
                  `/quote?jobId=111505&coId=${selectedCompany?.tenantId || '12'}&preview=true`
                }
                className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-300"
                title="Quote Layout Preview"
                onLoad={() => {
                  // When the iframe finishes loading, send the layout config
                  // Small delay to ensure React in the iframe has mounted
                  if (layoutConfig) {
                    setTimeout(() => updatePreview(layoutConfig), 300);
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Floating AI Chat Widget */}
      <LayoutBuilderChatWidget
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isLoading={chatLoading}
        isOpen={chatOpen}
        onOpenChange={setChatOpen}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page wrapper with Suspense (needed for useSearchParams)
// ---------------------------------------------------------------------------

export default function LayoutBuilderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <LayoutBuilderContent />
    </Suspense>
  );
}
