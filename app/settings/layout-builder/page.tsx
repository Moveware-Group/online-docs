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
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  // Layout state
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Status messages
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Preview iframe ref
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
            name: match.companyName || match.name,
            brandCode: match.brandCode,
            primaryColor: match.primaryColor,
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

  // ---- File Upload ----
  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/layouts/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      setReferenceFilePath(data.url);
      setReferenceFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ---- Generate Layout ----
  const handleGenerate = async () => {
    if (!selectedCompany) {
      setError('Please select a company first');
      return;
    }
    if (!description.trim()) {
      setError('Please enter a description of the desired layout');
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
          secondaryColor: '#1e40af',
          logoUrl: selectedCompany.logoUrl,
          referenceUrl: referenceUrl || undefined,
          description,
          conversationHistory,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Generation failed');
      }

      setLayoutConfig(data.data);
      addAssistantMessage(data.message || 'Layout generated! Check the preview on the right. Let me know if you want any changes.');
      updatePreview(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
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
          secondaryColor: '#1e40af',
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
  const handleSendMessage = async () => {
    const message = chatInput.trim();
    if (!message || chatLoading) return;

    setChatInput('');
    addUserMessage(message);

    // Determine if this is a layout modification request or general chat
    const isModification = layoutConfig && /change|update|move|make|add|remove|hide|show|swap|replace|bigger|smaller|different|modify|adjust|set|use/i.test(message);

    if (isModification) {
      await handleRefine(message);
    } else {
      await handleChat(message);
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
        {/* LEFT PANEL: Form + Chat */}
        <div className="w-[420px] flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Form Section */}
          <div className="p-4 border-b border-gray-200 overflow-y-auto flex-shrink-0" style={{ maxHeight: '50%' }}>
            <h2 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Layout Request</h2>

            {referenceUrl && (
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800">
                    <strong>Important:</strong> The AI cannot view the reference URL. You must describe the layout in detail in the Description field, including:
                    <ul className="list-disc ml-4 mt-1 space-y-0.5">
                      <li>Header design (colors, logo position, banner)</li>
                      <li>Section order and structure</li>
                      <li>Typography and spacing</li>
                      <li>Color scheme and styling details</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {/* Company Dropdown */}
              <CompanySearchDropdown
                value={selectedCompany}
                onChange={setSelectedCompany}
                disabled={generating}
              />

              {/* Reference URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference URL (Optional)</label>
                <input
                  type="url"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                  placeholder="https://example.com/quote-sample"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={generating}
                />
                <p className="text-xs text-gray-400 mt-0.5">
                  URL of the existing quote page to match. The AI will attempt to replicate this layout exactly based on your detailed description below.
                </p>
              </div>

              {/* Reference File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference File</label>
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
                  <label className={`flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors ${uploading ? 'opacity-50 cursor-wait' : ''}`}>
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                      className="hidden"
                      disabled={uploading || generating}
                    />
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                      <Upload className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-500">Upload PDF or image</span>
                  </label>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                  {referenceUrl && <span className="text-red-600 ml-1">*</span>}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    referenceUrl
                      ? "IMPORTANT: Describe the reference layout in DETAIL. Include: header design (colors, gradients, logo placement), section order, styling details, typography, spacing, etc. Be very specific - the AI cannot see the URL."
                      : "Describe the desired layout, style, and any specific requirements..."
                  }
                  rows={referenceUrl ? 5 : 3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  disabled={generating}
                />
                {referenceUrl && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    ⚠️ Be VERY detailed in your description. The AI cannot view the reference URL - it relies entirely on your description to match the layout exactly.
                  </p>
                )}
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedCompany || !description.trim()}
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

          {/* Chat Section */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100 flex-shrink-0">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                AI Chat
              </h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chatMessages.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Select a company and generate a layout to get started.</p>
                  <p className="mt-1">Then chat with the AI to refine it.</p>
                </div>
              )}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 px-3 py-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-gray-200 flex-shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={layoutConfig ? 'Ask to modify the layout...' : 'Generate a layout first...'}
                  disabled={chatLoading || !selectedCompany}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatLoading || !selectedCompany}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
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
                /quote?jobId=111505&coId=12&preview=true
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
                src={`/quote?jobId=111505&coId=12&preview=true`}
                className="w-full h-full bg-white rounded-lg shadow-lg border border-gray-300"
                title="Quote Layout Preview"
              />
            )}
          </div>
        </div>
      </div>
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
