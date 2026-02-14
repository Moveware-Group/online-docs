/**
 * Conversation Store
 * Manages bot conversation state using Zustand
 */

import { create } from "zustand";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ConversationState {
  conversationId: string | null;
  companyId: string | null;
  workflowType: string | null;
  currentStep: number;
  messages: Message[];
  context: Record<string, unknown>;
  metadata: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setConversationId: (id: string) => void;
  setCompanyId: (id: string) => void;
  setWorkflowType: (type: string) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  updateContext: (context: Record<string, unknown>) => void;
  updateMetadata: (metadata: Record<string, unknown>) => void;
  setCurrentStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetConversation: () => void;
  resumeConversation: (conversationData: {
    id: string;
    companyId: string;
    workflowType: string;
    currentStep: number;
    messages: Message[];
    context: Record<string, unknown>;
    metadata: Record<string, unknown>;
  }) => void;
}

const initialState = {
  conversationId: null,
  companyId: null,
  workflowType: null,
  currentStep: 0,
  messages: [],
  context: {},
  metadata: {},
  isLoading: false,
  error: null,
};

export const useConversationStore = create<ConversationState>((set) => ({
  ...initialState,

  setConversationId: (id) => set({ conversationId: id }),

  setCompanyId: (id) => set({ companyId: id }),

  setWorkflowType: (type) => set({ workflowType: type }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  updateContext: (context) =>
    set((state) => ({
      context: { ...state.context, ...context },
    })),

  updateMetadata: (metadata) =>
    set((state) => ({
      metadata: { ...state.metadata, ...metadata },
    })),

  setCurrentStep: (step) => set({ currentStep: step }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  resetConversation: () => set(initialState),

  /**
   * Resume a conversation by loading its full state
   * @param conversationData - Full conversation data including messages and state
   */
  resumeConversation: (conversationData) =>
    set({
      conversationId: conversationData.id,
      companyId: conversationData.companyId,
      workflowType: conversationData.workflowType,
      currentStep: conversationData.currentStep,
      messages: conversationData.messages,
      context: conversationData.context || {},
      metadata: conversationData.metadata || {},
      isLoading: false,
      error: null,
    }),
}));
