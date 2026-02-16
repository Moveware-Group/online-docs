"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface HealthCheck {
  healthy: boolean;
  checks: {
    anthropic: boolean;
    openai: boolean;
    playwright: boolean;
    anthropicError: string | null;
    openaiError: string | null;
    playwrightError: string | null;
  };
  recommendations: string[];
}

export default function LayoutBuilderDiagnosticsPage() {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHealth = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/layouts/health");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load health check");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Running diagnostics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <XCircle className="w-12 h-12 mx-auto mb-3" />
          <p className="text-lg font-semibold">Diagnostics Failed</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Layout Builder Diagnostics</h1>
            <p className="text-gray-600 mt-1">System dependency and configuration check</p>
          </div>
          <button
            onClick={loadHealth}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {health && (
          <>
            {/* Overall Status */}
            <div className={`p-6 rounded-lg mb-6 ${health.healthy ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-3">
                {health.healthy ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <XCircle className="w-8 h-8 text-red-600" />
                )}
                <div>
                  <h2 className={`text-xl font-bold ${health.healthy ? 'text-green-900' : 'text-red-900'}`}>
                    {health.healthy ? 'System Ready' : 'Configuration Required'}
                  </h2>
                  <p className={`text-sm ${health.healthy ? 'text-green-700' : 'text-red-700'}`}>
                    {health.healthy
                      ? 'All required dependencies are configured'
                      : 'Some required dependencies are missing'}
                  </p>
                </div>
              </div>
            </div>

            {/* Dependency Checks */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-bold text-gray-900">Dependencies</h3>
              </div>

              {/* Anthropic */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  {health.checks.anthropic ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Anthropic (Claude)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {health.checks.anthropic ? (
                        <span className="text-green-700">✓ API key configured</span>
                      ) : (
                        <span className="text-red-700">{health.checks.anthropicError}</span>
                      )}
                    </div>
                    {!health.checks.anthropic && (
                      <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                        <strong>Setup:</strong> Add <code className="bg-gray-200 px-1">ANTHROPIC_API_KEY=your_key</code> to .env file
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* OpenAI */}
              <div className="px-6 py-4 border-b border-gray-100">
                <div className="flex items-start gap-3">
                  {health.checks.openai ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">OpenAI (GPT)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {health.checks.openai ? (
                        <span className="text-green-700">✓ API key configured</span>
                      ) : (
                        <span className="text-amber-700">{health.checks.openaiError} (Optional - fallback provider)</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Playwright */}
              <div className="px-6 py-4">
                <div className="flex items-start gap-3">
                  {health.checks.playwright ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Playwright (Browser Automation)</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {health.checks.playwright ? (
                        <span className="text-green-700">✓ Installed and available</span>
                      ) : (
                        <span className="text-amber-700">{health.checks.playwrightError}</span>
                      )}
                    </div>
                    {!health.checks.playwright && (
                      <div className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded">
                        <strong>Setup:</strong>
                        <pre className="mt-1 text-xs">npm install{'\n'}npx playwright install chromium{'\n'}sudo npx playwright install-deps chromium</pre>
                        <p className="mt-2">
                          <strong>Note:</strong> Without Playwright, URL screenshot capture won't work. You can still upload PDFs/images or use descriptions.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {health.recommendations.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-amber-900 mb-3">Recommendations</h3>
                <ul className="space-y-2">
                  {health.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Link
                href="/settings/layout-builder"
                className="flex-1 px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Go to Layout Builder
              </Link>
              <Link
                href="/settings"
                className="px-4 py-3 bg-gray-200 text-gray-700 text-center rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to Settings
              </Link>
            </div>

            {/* Documentation Links */}
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-bold text-blue-900 mb-3">Setup Documentation</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="/docs/ai-layout-guide" target="_blank" className="text-blue-600 hover:underline">
                    → AI Layout Builder User Guide
                  </a>
                </li>
                <li>
                  <span className="text-blue-600">→ Server Setup Guide</span> (see docs/LAYOUT_BUILDER_SETUP.md)
                </li>
                <li>
                  <span className="text-blue-600">→ Browser Automation Setup</span> (see docs/BROWSER_AUTOMATION_SETUP.md)
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
