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
  X,
  Bot,
  User,
  ArrowLeft,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/auth-context';
import { LoginForm } from '@/lib/components/auth/login-form';
import {
  CompanySearchDropdown,
  CompanyOption,
} from '@/lib/components/forms/company-search-dropdown';
import type { LayoutConfig } from '@/lib/services/llm-service';
import { LayoutBuilderChatWidget } from '@/lib/components/chat/layout-builder-chat-widget';

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

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Status messages
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Preview iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Pre-select company if companyId in URL
  useEffect(() => {
    if (preselectedCompanyId) {
      fetchCompanyById(preselectedCompanyId);
    }
  }, [preselectedCompanyId]);

  // Load existing layout when company is selected
  useEffect(() => {
    if (selectedCompany?.id) {
      loadExistingLayout(selectedCompany.id);
    }
  }, [selectedCompany?.id]);

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
          setLayoutConfig(data.data.layoutConfig);
          setReferenceUrl(data.data.referenceUrl || '');
          setDescription(data.data.description || '');
          setReferenceFilePath(data.data.referenceFile || '');
          setStatusMessage('Existing layout loaded. You can refine it or generate a new one.');
          addAssistantMessage('I loaded the existing custom layout for this company. You can ask me to modify it, or fill in the form and click "Generate Layout" to start fresh.');
        }
      }
    } catch {
      // No existing layout — that's fine
    }
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
      
      // Show warnings in chat if URL capture failed
      if (data.warnings && data.warnings.length > 0) {
        addAssistantMessage(data.message);
      } else {
        addAssistantMessage(data.message || 'Layout generated successfully. Review the preview and provide feedback to refine it.');
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
    if (!selectedCompany || !layoutConfig) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/layouts/${selectedCompany.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layoutConfig,
          referenceUrl: referenceUrl || null,
          referenceFile: referenceFilePath || null,
          description: description || null,
          isActive: true,
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
          <div className="flex items-center gap-2">
            {error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {error || statusMessage}
            <button
              onClick={() => { setError(null); setStatusMessage(null); }}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT PANEL: Form */}
        <div className="w-[420px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Form Section */}
          <div className="p-4 overflow-y-auto">
            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Layout Request</h2>

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
                      accept=".pdf,.html,.htm,image/png,image/jpeg,image/webp"
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
                        {isDragging ? 'Drop file here' : 'Upload or drag & drop PDF/HTML/image'}
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

        </div>

        {/* RIGHT PANEL: Live Preview */}
        <div className="flex-1 flex flex-col overflow-hidden bg-gray-200">
          <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-600" />
              Live Preview
            </h2>
            {selectedCompany && (
              <span className="text-xs text-gray-500">
                /quote?jobId=111505&coId={selectedCompany.tenantId || '12'}&preview=true
              </span>
            )}
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
                src={`/quote?jobId=111505&coId=${selectedCompany?.tenantId || '12'}&preview=true`}
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
