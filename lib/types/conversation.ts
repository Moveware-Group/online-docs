/**
 * Conversation state types for Zustand store
 */

export type ConversationWorkflowType = "company-setup" | "custom-layout";

export type ConversationStatus =
  | "idle"
  | "active"
  | "paused"
  | "completed"
  | "error";

export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationMetadata {
  startedAt: number;
  user?: string;
  status: ConversationStatus;
  lastUpdatedAt: number;
}

export interface AsyncJobStatus {
  jobId?: string;
  status: JobStatus;
  progress?: number;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface ConversationState {
  // Core state
  conversationId: string | null;
  messages: Message[];
  workflow: ConversationWorkflowType;
  metadata: ConversationMetadata;
  jobStatus: AsyncJobStatus;

  // Actions
  setConversationId: (id: string | null) => void;
  addMessage: (message: Omit<Message, "id" | "timestamp">) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setWorkflow: (workflow: ConversationWorkflowType) => void;
  updateMetadata: (updates: Partial<ConversationMetadata>) => void;
  updateJobStatus: (updates: Partial<AsyncJobStatus>) => void;
  resetConversation: () => void;
}
