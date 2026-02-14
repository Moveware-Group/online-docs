"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ConversationState,
  Message,
  WorkflowType,
  ConversationMetadata,
  AsyncJobStatus,
} from "@/lib/types/conversation";

/**
 * Initial state for the conversation store
 */
const initialMetadata: ConversationMetadata = {
  startedAt: Date.now(),
  status: "idle",
  lastUpdatedAt: Date.now(),
};

const initialJobStatus: AsyncJobStatus = {
  status: "pending",
};

/**
 * Zustand store for conversation state management
 * Persisted to sessionStorage for page refresh resilience
 */
export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      // Initial state
      conversationId: null,
      messages: [],
      workflow: "company-setup",
      metadata: initialMetadata,
      jobStatus: initialJobStatus,

      // Actions
      setConversationId: (id) => {
        set({
          conversationId: id,
          metadata: {
            ...get().metadata,
            lastUpdatedAt: Date.now(),
          },
        });
      },

      addMessage: (message) => {
        const newMessage: Message = {
          ...message,
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
        };

        set({
          messages: [...get().messages, newMessage],
          metadata: {
            ...get().metadata,
            status: "active",
            lastUpdatedAt: Date.now(),
          },
        });
      },

      updateMessage: (id, updates) => {
        set({
          messages: get().messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg,
          ),
          metadata: {
            ...get().metadata,
            lastUpdatedAt: Date.now(),
          },
        });
      },

      clearMessages: () => {
        set({
          messages: [],
          metadata: {
            ...get().metadata,
            lastUpdatedAt: Date.now(),
          },
        });
      },

      setWorkflow: (workflow) => {
        set({
          workflow,
          metadata: {
            ...get().metadata,
            lastUpdatedAt: Date.now(),
          },
        });
      },

      updateMetadata: (updates) => {
        set({
          metadata: {
            ...get().metadata,
            ...updates,
            lastUpdatedAt: Date.now(),
          },
        });
      },

      updateJobStatus: (updates) => {
        set({
          jobStatus: {
            ...get().jobStatus,
            ...updates,
          },
          metadata: {
            ...get().metadata,
            lastUpdatedAt: Date.now(),
          },
        });
      },

      resetConversation: () => {
        set({
          conversationId: null,
          messages: [],
          workflow: "company-setup",
          metadata: {
            startedAt: Date.now(),
            status: "idle",
            lastUpdatedAt: Date.now(),
          },
          jobStatus: {
            status: "pending",
          },
        });
      },
    }),
    {
      name: "conversation-storage",
      storage: createJSONStorage(() => sessionStorage),
      // Only persist specific fields
      partialize: (state) => ({
        conversationId: state.conversationId,
        messages: state.messages,
        workflow: state.workflow,
        metadata: state.metadata,
        jobStatus: state.jobStatus,
      }),
    },
  ),
);

/**
 * Selector hooks for better performance
 */
export const useConversationId = () =>
  useConversationStore((state) => state.conversationId);

export const useMessages = () =>
  useConversationStore((state) => state.messages);

export const useWorkflow = () =>
  useConversationStore((state) => state.workflow);

export const useConversationMetadata = () =>
  useConversationStore((state) => state.metadata);

export const useJobStatus = () =>
  useConversationStore((state) => state.jobStatus);

export const useConversationActions = () =>
  useConversationStore((state) => ({
    setConversationId: state.setConversationId,
    addMessage: state.addMessage,
    updateMessage: state.updateMessage,
    clearMessages: state.clearMessages,
    setWorkflow: state.setWorkflow,
    updateMetadata: state.updateMetadata,
    updateJobStatus: state.updateJobStatus,
    resetConversation: state.resetConversation,
  }));
