"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, X, Minimize2 } from "lucide-react";
import { ChatInterface } from "@/lib/components/bot/chat-interface";

export function FloatingChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Hide on layout builder page since it has its own AI chat interface
  if (pathname === "/settings/layout-builder") {
    return null;
  }

  const toggleChat = () => {
    if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
      setIsMinimized(false);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
          aria-label="Open AI Assistant"
        >
          <Bot className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
            isMinimized
              ? "w-80 h-14"
              : "w-96 h-[600px] max-h-[calc(100vh-80px)]"
          }`}
        >
          <div className="bg-white rounded-xl shadow-2xl h-full flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">AI Assistant</h3>
                  <p className="text-xs text-blue-100">
                    {isMinimized ? "Click to expand" : "Online"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isMinimized && (
                  <button
                    onClick={minimizeChat}
                    className="hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
                    aria-label="Minimize chat"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={closeChat}
                  className="hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            {!isMinimized && (
              <div className="flex-1 overflow-hidden">
                <ChatInterface />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
