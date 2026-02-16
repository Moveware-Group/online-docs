"use client";

import { useState } from "react";
import { Loader2, ExternalLink, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LayoutBuilderDebugPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async () => {
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/layouts/debug-capture?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Capture failed");
        return;
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Capture failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/settings/layout-builder" className="text-sm text-blue-600 hover:underline mb-2 inline-block">
            ← Back to Layout Builder
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Layout Builder Debug</h1>
          <p className="text-gray-600 mt-1">Test URL capture and see what screenshot the AI receives</p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Reference URL to Capture
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://gracenz.moveware.app/rms/67200/customer-quote?jobId=..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleCapture()}
            />
            <button
              onClick={handleCapture}
              disabled={!url.trim() || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                'Capture URL'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This will use Playwright to capture a screenshot and HTML of the URL, just like the AI Layout Builder does.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Capture Failed</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <div className="mt-3 text-sm text-red-700">
                  <p className="font-semibold">Common causes:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Playwright not installed (run: <code className="bg-red-100 px-1">npx playwright install chromium</code>)</li>
                    <li>URL requires authentication (token expired?)</li>
                    <li>Server can't reach the URL (firewall/network issue)</li>
                    <li>URL returns non-200 status code</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                {result.hasScreenshot ? '✓ Full Capture Successful' : result.hasHtml ? '⚠️ HTML Only (No Screenshot)' : '✓ Capture Complete'}
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                {result.hasScreenshot && (
                  <div>
                    <span className="text-green-700 font-medium">Screenshot:</span>
                    <span className="text-green-900 ml-2">{result.screenshotSizeKB} KB</span>
                  </div>
                )}
                {result.hasHtml && (
                  <div>
                    <span className="text-green-700 font-medium">HTML:</span>
                    <span className="text-green-900 ml-2">{result.htmlSizeKB} KB</span>
                  </div>
                )}
                <div>
                  <span className="text-green-700 font-medium">Time:</span>
                  <span className="text-green-900 ml-2">{(result.elapsedMs / 1000).toFixed(1)}s</span>
                </div>
              </div>
              {result.partialError && (
                <p className="text-sm text-amber-700 mt-2">
                  Note: {result.partialError}
                </p>
              )}
            </div>

            {/* Screenshot */}
            {result.hasScreenshot && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-3">
                  Screenshot (This is what the AI sees)
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  This is the exact screenshot that gets sent to Claude. The AI analyzes this image to replicate the layout.
                </p>
                <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                  <img 
                    src={result.screenshotDataUrl} 
                    alt="Captured screenshot" 
                    className="w-full"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Does this screenshot show the full layout you want to replicate?</span>
                </div>
              </div>
            )}

            {!result.hasScreenshot && result.hasHtml && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <h3 className="font-bold text-amber-900 mb-2">No Screenshot Available</h3>
                <p className="text-sm text-amber-800">
                  The server was able to fetch HTML but could not capture a screenshot. 
                  The AI will use the HTML structure to generate the layout, but results may be less accurate without a visual reference.
                </p>
                <p className="text-sm text-amber-700 mt-2">
                  <strong>Recommendation:</strong> For best results, save the page as PDF from your browser and upload it instead.
                </p>
              </div>
            )}

            {/* HTML Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-3">HTML Preview (First 2000 chars)</h3>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs text-gray-700 border border-gray-200">
                {result.htmlPreview}
              </pre>
            </div>

            {/* Actions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="font-bold">1.</span>
                  <span>Verify the screenshot above shows the complete layout you want to replicate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">2.</span>
                  <span>If the screenshot looks good, try generating the layout in the Layout Builder</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">3.</span>
                  <span>If the screenshot is incomplete/wrong, the reference URL might need adjustment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold">4.</span>
                  <span>Alternative: Save the page as PDF from your browser and upload it instead</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Link
                href="/settings/layout-builder"
                className="flex-1 px-4 py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Go to Layout Builder
              </Link>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-3 bg-gray-200 text-gray-700 text-center rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
              >
                Open Reference URL
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
