import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  BotMessageRequest,
  BotMessageResponse,
  BotContext,
} from "@/lib/types/bot";
import { botWorkflowService } from "@/lib/services/botWorkflowService";

/**
 * POST /api/bot/message
 * Handle incoming bot messages with conversation context and workflow routing
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<BotMessageResponse>> {
  try {
    const body: BotMessageRequest = await request.json();

    // Validate required fields
    if (
      !body.message ||
      typeof body.message !== "string" ||
      body.message.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Message is required and must be a non-empty string",
          error: "Invalid message",
        },
        { status: 400 },
      );
    }

    if (
      !body.sessionId ||
      typeof body.sessionId !== "string" ||
      body.sessionId.trim() === ""
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Session ID is required and must be a non-empty string",
          error: "Invalid session ID",
        },
        { status: 400 },
      );
    }

    const {
      message,
      sessionId,
      idempotencyKey,
      context: requestContext,
    } = body;

    // Prisma client may not include newer models in generated types yet
    const prismaClient = prisma as any;

    // Check idempotency key if provided
    if (idempotencyKey) {
      const existingRequest = await prismaClient.botMessageLog.findUnique({
        where: { idempotencyKey },
      });

      if (existingRequest) {
        console.log(`Idempotent request detected: ${idempotencyKey}`);
        return NextResponse.json(
          JSON.parse(existingRequest.response) as BotMessageResponse,
          { status: 200 },
        );
      }
    }

    // Load conversation context from database
    let conversation = await prismaClient.conversation.findUnique({
      where: { sessionId },
      include: {
        messages: {
          orderBy: { timestamp: "asc" },
          take: 50, // Last 50 messages for context
        },
      },
    });

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await prismaClient.conversation.create({
        data: {
          sessionId,
          metadata: requestContext?.metadata || {},
        },
        include: { messages: true },
      });
    }

    // Build bot context
    const botContext: BotContext = {
      sessionId,
      conversationHistory: conversation.messages.map((msg: any) => ({
        role: msg.role as "user" | "bot",
        message: msg.message,
        timestamp: msg.timestamp.toISOString(),
      })),
      currentWorkflow: conversation.currentWorkflow || undefined,
      metadata: {
        ...conversation.metadata,
        ...requestContext?.metadata,
        jobId: requestContext?.jobId,
        companyId: requestContext?.companyId,
        userId: requestContext?.userId,
      },
    };

    // Save user message
    await prismaClient.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        message: message.trim(),
      },
    });

    // Process message through workflow service
    const response = await botWorkflowService.processMessage(
      message.trim(),
      botContext,
    );

    // Save bot response
    await prismaClient.conversationMessage.create({
      data: {
        conversationId: conversation.id,
        role: "bot",
        message: response.message,
      },
    });

    // Update conversation workflow if changed
    if (
      response.workflowType &&
      response.workflowType !== conversation.currentWorkflow
    ) {
      await prismaClient.conversation.update({
        where: { id: conversation.id },
        data: { currentWorkflow: response.workflowType },
      });
    }

    // Log request with idempotency key if provided
    if (idempotencyKey) {
      await prismaClient.botMessageLog.create({
        data: {
          idempotencyKey,
          sessionId,
          message: message.trim(),
          response: JSON.stringify(response),
        },
      });
    }

    // Return response
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error processing bot message:", error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid JSON in request body",
          error: "Invalid request format",
        },
        { status: 400 },
      );
    }

    // Handle database errors
    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        {
          success: false,
          message: "Database error occurred. Please try again later.",
          error: "Database error",
        },
        { status: 500 },
      );
    }

    // Generic error
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again later.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/bot/message
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      endpoint: "/api/bot/message",
      methods: ["POST"],
      description: "Send messages to the bot with conversation context",
      requiredFields: ["message", "sessionId"],
      optionalFields: ["idempotencyKey", "context"],
    },
    { status: 200 },
  );
}
