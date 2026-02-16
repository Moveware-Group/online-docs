"use client";

import { useEffect, useState } from "react";
import { LayoutRenderer } from "@/lib/components/layout/layout-renderer";
import { LayoutConfig } from "@/lib/services/llm-service";
import { getMockQuoteData } from "@/lib/data/mock-quote-data";
import { Loader2 } from "lucide-react";

export default function QuotePreviewPage() {
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for layout config from parent window (layout builder)
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "LAYOUT_PREVIEW_UPDATE" && event.data.config) {
        console.log("[Quote Preview] Received layout config:", event.data.config);
        setLayoutConfig(event.data.config);
        setLoading(false);
      }
    };

    window.addEventListener("message", handleMessage);

    // Signal that we're ready to receive config
    window.parent.postMessage({ type: "PREVIEW_READY" }, "*");

    // Auto-hide loading after 2 seconds if no config received
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearTimeout(timeout);
    };
  }, []);

  // Get mock data for preview
  const mockData = getMockQuoteData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (!layoutConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <p className="text-lg">No layout configuration provided</p>
          <p className="text-sm mt-2">Waiting for layout data from builder...</p>
        </div>
      </div>
    );
  }

  return <LayoutRenderer config={layoutConfig} data={mockData} />;
}
