"use client";

import { useState } from "react";
import { Bot, Settings as SettingsIcon, ChevronRight } from "lucide-react";
import { AIAssistantModal } from "@/lib/components/modals/ai-assistant-modal";

export function SettingsPageContent() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* AI Setup Assistant Card - Prominent */}
          <div
            onClick={() => setIsAssistantOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      AI Setup Assistant
                    </h2>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500 text-white mt-1">
                      New
                    </span>
                  </div>
                </div>
                <p className="text-lg text-blue-100 mb-6 max-w-2xl">
                  Let our AI assistant guide you through setting up your
                  workflow, configuring options, and answering questions. Get
                  personalized help in minutes.
                </p>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <span>Launch Assistant</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Other Settings Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Placeholder cards for other settings */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                General Settings
              </h3>
              <p className="text-gray-600">
                Configure general application preferences
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Branding
              </h3>
              <p className="text-gray-600">
                Customize your company branding and appearance
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />
    </div>
  );
}
