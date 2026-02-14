/**
 * Conversation Service
 * Handles conversation-related API calls
 */

import type { Message } from "@/lib/stores/conversation-store";

export interface ConversationListItem {
  id: string;
  companyId: string;
  workflowType: string;
  status: string;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

export interface ConversationDetail {
  id: string;
  companyId: string;
  workflowType: string;
  status: string;
  currentStep: number;
  metadata: Record<string, unknown>;
  context: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

/**
 * Fetch list of conversations for a company
 */
export async function getConversations(
  companyId: string,
): Promise<ConversationListItem[]> {
  const response = await fetch(`/api/bot/conversations?companyId=${companyId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch conversations");
  }

  return response.json();
}

/**
 * Fetch a specific conversation with full message history
 * Only returns if conversation status is 'active'
 */
export async function getConversation(
  conversationId: string,
): Promise<ConversationDetail> {
  const response = await fetch(`/api/bot/conversations/${conversationId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch conversation");
  }

  return response.json();
}

/**
 * Resume a conversation in the store
 */
export async function resumeConversation(
  conversationId: string,
  resumeFn: (data: ConversationDetail) => void,
): Promise<void> {
  try {
    const conversation = await getConversation(conversationId);
    resumeFn(conversation);
  } catch (error) {
    console.error("Error resuming conversation:", error);
    throw error;
  }
}
