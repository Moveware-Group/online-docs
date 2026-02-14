/**
 * Bot Workflow Service
 * Routes incoming messages to appropriate workflow handlers
 */

import {
  BotContext,
  BotMessageResponse,
  WorkflowType,
  WorkflowHandler,
} from "@/lib/types/bot";

/**
 * Analyze message intent and determine workflow type
 */
function analyzeIntent(message: string, context: BotContext): WorkflowType {
  const lowerMessage = message.toLowerCase().trim();

  // Quote request keywords
  const quoteKeywords = [
    "quote",
    "pricing",
    "cost",
    "price",
    "estimate",
    "how much",
  ];
  if (quoteKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return "quote_request";
  }

  // Job inquiry keywords
  const jobKeywords = [
    "job",
    "order",
    "booking",
    "schedule",
    "appointment",
    "status",
  ];
  if (jobKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return "job_inquiry";
  }

  // Review keywords
  const reviewKeywords = [
    "review",
    "feedback",
    "rating",
    "survey",
    "experience",
  ];
  if (reviewKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return "review_submission";
  }

  // FAQ keywords
  const faqKeywords = [
    "help",
    "how",
    "what",
    "when",
    "where",
    "why",
    "can i",
    "do you",
  ];
  if (faqKeywords.some((keyword) => lowerMessage.includes(keyword))) {
    return "faq";
  }

  // Check context for ongoing workflow
  if (context.currentWorkflow) {
    return context.currentWorkflow;
  }

  return "general_question";
}

/**
 * Quote Request Handler
 */
class QuoteRequestHandler implements WorkflowHandler {
  type: WorkflowType = "quote_request";

  canHandle(message: string, context: BotContext): boolean {
    return this.type === analyzeIntent(message, context);
  }

  async handle(
    message: string,
    context: BotContext,
  ): Promise<BotMessageResponse> {
    return {
      success: true,
      message:
        "I'd be happy to help you with a quote! To provide an accurate estimate, I'll need some information about your move. Could you please tell me:\n\n" +
        "1. Where are you moving from?\n" +
        "2. Where are you moving to?\n" +
        "3. When do you plan to move?\n" +
        "4. Approximate size of your move (e.g., 1-bedroom apartment, 3-bedroom house)?",
      workflowType: this.type,
      data: {
        nextAction: "collect_move_details",
        requiresInput: true,
        suggestions: [
          "I need a quote for moving",
          "What information do you need?",
          "Can you send me a quote form?",
        ],
      },
    };
  }
}

/**
 * Job Inquiry Handler
 */
class JobInquiryHandler implements WorkflowHandler {
  type: WorkflowType = "job_inquiry";

  canHandle(message: string, context: BotContext): boolean {
    return this.type === analyzeIntent(message, context);
  }

  async handle(
    message: string,
    context: BotContext,
  ): Promise<BotMessageResponse> {
    const jobId = context.metadata?.jobId;

    if (jobId) {
      return {
        success: true,
        message:
          `I can help you with job ${jobId}. What would you like to know?\n\n` +
          "You can ask about:\n" +
          "- Job status\n" +
          "- Schedule details\n" +
          "- Inventory information\n" +
          "- Cost breakdown",
        workflowType: this.type,
        data: {
          jobId,
          nextAction: "provide_job_info",
          requiresInput: true,
          suggestions: [
            "What is the status of my job?",
            "When is my scheduled move?",
            "Show me the inventory",
          ],
        },
      };
    }

    return {
      success: true,
      message:
        "I can help you with job information. Please provide your job ID or booking number.",
      workflowType: this.type,
      data: {
        nextAction: "collect_job_id",
        requiresInput: true,
        suggestions: ["My job ID is...", "I need help with my booking"],
      },
    };
  }
}

/**
 * Review Submission Handler
 */
class ReviewSubmissionHandler implements WorkflowHandler {
  type: WorkflowType = "review_submission";

  canHandle(message: string, context: BotContext): boolean {
    return this.type === analyzeIntent(message, context);
  }

  async handle(
    message: string,
    context: BotContext,
  ): Promise<BotMessageResponse> {
    return {
      success: true,
      message:
        "Thank you for wanting to share your feedback! I'll guide you through our review process.\n\n" +
        "Please provide your job ID so I can pull up the details of your move.",
      workflowType: this.type,
      data: {
        nextAction: "collect_review_job_id",
        requiresInput: true,
        suggestions: ["My job ID is...", "Start review process"],
      },
    };
  }
}

/**
 * General Question Handler
 */
class GeneralQuestionHandler implements WorkflowHandler {
  type: WorkflowType = "general_question";

  canHandle(message: string, context: BotContext): boolean {
    return this.type === analyzeIntent(message, context);
  }

  async handle(
    message: string,
    context: BotContext,
  ): Promise<BotMessageResponse> {
    return {
      success: true,
      message:
        "Hello! I'm here to help you with:\n\n" +
        "📋 **Quote Requests** - Get pricing estimates for your move\n" +
        "📦 **Job Inquiries** - Check status, schedule, and details\n" +
        "⭐ **Reviews** - Share your moving experience\n" +
        "❓ **Questions** - Ask me anything about our services\n\n" +
        "What would you like help with today?",
      workflowType: this.type,
      data: {
        nextAction: "await_user_intent",
        requiresInput: true,
        suggestions: [
          "I need a quote",
          "Check my job status",
          "Submit a review",
          "General questions",
        ],
      },
    };
  }
}

/**
 * FAQ Handler
 */
class FAQHandler implements WorkflowHandler {
  type: WorkflowType = "faq";

  canHandle(message: string, context: BotContext): boolean {
    return this.type === analyzeIntent(message, context);
  }

  async handle(
    message: string,
    context: BotContext,
  ): Promise<BotMessageResponse> {
    const lowerMessage = message.toLowerCase();

    // Simple FAQ matching
    if (lowerMessage.includes("hours") || lowerMessage.includes("open")) {
      return {
        success: true,
        message:
          "Our business hours are:\n" +
          "Monday - Friday: 8:00 AM - 6:00 PM\n" +
          "Saturday: 9:00 AM - 4:00 PM\n" +
          "Sunday: Closed\n\n" +
          "For after-hours emergencies, please call our emergency line.",
        workflowType: this.type,
        data: {
          suggestions: [
            "Contact information",
            "Other questions",
            "Get a quote",
          ],
        },
      };
    }

    if (
      lowerMessage.includes("contact") ||
      lowerMessage.includes("phone") ||
      lowerMessage.includes("email")
    ) {
      return {
        success: true,
        message:
          "You can reach us at:\n" +
          "📞 Phone: 1-800-MOVEWARE\n" +
          "📧 Email: info@moveware.com\n" +
          "🌐 Website: www.moveware.com\n\n" +
          "We typically respond within 24 hours during business days.",
        workflowType: this.type,
        data: {
          suggestions: ["Business hours", "Get a quote", "Other questions"],
        },
      };
    }

    return {
      success: true,
      message:
        "I'm here to answer your questions! Here are some common topics:\n\n" +
        "• Business hours and contact information\n" +
        "• Services we offer\n" +
        "• Pricing and quotes\n" +
        "• Moving tips and preparation\n\n" +
        "What would you like to know?",
      workflowType: this.type,
      data: {
        suggestions: [
          "What are your hours?",
          "How do I contact you?",
          "What services do you offer?",
        ],
      },
    };
  }
}

/**
 * Bot Workflow Service
 */
export class BotWorkflowService {
  private handlers: WorkflowHandler[];

  constructor() {
    this.handlers = [
      new QuoteRequestHandler(),
      new JobInquiryHandler(),
      new ReviewSubmissionHandler(),
      new FAQHandler(),
      new GeneralQuestionHandler(),
    ];
  }

  /**
   * Process incoming message and route to appropriate handler
   */
  async processMessage(
    message: string,
    context: BotContext,
  ): Promise<BotMessageResponse> {
    try {
      // Find appropriate handler
      const handler = this.handlers.find((h) => h.canHandle(message, context));

      if (!handler) {
        // Fallback to general question handler
        const generalHandler = this.handlers.find(
          (h) => h.type === "general_question",
        );
        if (generalHandler) {
          return await generalHandler.handle(message, context);
        }

        return {
          success: false,
          message:
            "I'm sorry, I didn't understand that. Could you please rephrase?",
          error: "No suitable handler found",
        };
      }

      // Process with handler
      return await handler.handle(message, context);
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        success: false,
        message:
          "I apologize, but I encountered an error processing your message. Please try again or contact support if the issue persists.",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export singleton instance
export const botWorkflowService = new BotWorkflowService();
