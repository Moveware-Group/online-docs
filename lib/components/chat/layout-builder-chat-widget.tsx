"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, X, Minimize2, Send, User, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface LayoutBuilderChatWidgetProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LayoutBuilderChatWidget({
  messages,
  onSendMessage,
  isLoading,
  isOpen,
  onOpenChange,
}: LayoutBuilderChatWidgetProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !isMinimized) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Auto-open when first assistant message arrives
  useEffect(() => {
    if (messages.length > 0 && !isOpen) {
      const hasAssistantMessage = messages.some(m => m.role === 'assistant');
      if (hasAssistantMessage) {
        onOpenChange(true);
      }
    }
  }, [messages, isOpen, onOpenChange]);

  const handleSend = () => {
    const message = input.trim();
    if (!message || isLoading) return;
    
    setInput("");
    onSendMessage(message);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const close = () => {
    onOpenChange(false);
    setIsMinimized(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => onOpenChange(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 group"
        aria-label="Open AI Chat"
      >
        <Bot className="w-6 h-6" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isMinimized ? "w-80 h-14" : "w-96 h-[500px]"
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl h-full flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Layout Assistant</h3>
              <p className="text-xs text-blue-100">
                {isMinimized ? "Click to expand" : "Ask me to refine the layout"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!isMinimized && (
              <button
                onClick={toggleMinimize}
                className="hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
                aria-label="Minimize chat"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={close}
              className="hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Content */}
        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8">
                  <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p>Generate a layout to get started.</p>
                  <p className="mt-1">Then chat with me to refine it.</p>
                </div>
              )}
              {messages.map((msg) => (
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
                        : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
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
              {isLoading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="bg-white px-3 py-2 rounded-lg border border-gray-200">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-gray-200 bg-white flex-shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask to modify the layout..."
                  disabled={isLoading}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
