/**
 * Bot Message Handling Types
 */

export type WorkflowType =
  | "quote_request"
  | "job_inquiry"
  | "review_submission"
  | "general_question"
  | "faq"
  | "unknown";

export interface BotMessageRequest {
  message: string;
  sessionId: string;
  idempotencyKey?: string;
  context?: {
    jobId?: string;
    companyId?: string;
    userId?: string;
    metadata?: Record<string, any>;
  };
}

export interface BotMessageResponse {
  success: boolean;
  message: string;
  workflowType?: WorkflowType;
  data?: {
    jobId?: string;
    quoteId?: string;
    nextAction?: string;
    suggestions?: string[];
    requiresInput?: boolean;
    metadata?: Record<string, any>;
  };
  error?: string;
}

export interface BotContext {
  sessionId: string;
  conversationHistory: Array<{
    role: "user" | "bot";
    message: string;
    timestamp: string;
  }>;
  currentWorkflow?: WorkflowType;
  metadata?: Record<string, any>;
}

export interface WorkflowHandler {
  type: WorkflowType;
  canHandle: (message: string, context: BotContext) => boolean;
  handle: (message: string, context: BotContext) => Promise<BotMessageResponse>;
}
