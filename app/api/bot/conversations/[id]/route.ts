/**
 * GET /api/bot/conversations/[id]
 * Retrieve a specific conversation with full message history for resuming
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // Fetch conversation - messages is stored as JSON field
    const conversation = await prisma.botConversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }

    // Only allow resuming active conversations
    if (conversation.status !== "active") {
      return NextResponse.json(
        {
          error: "Can only resume active conversations",
          status: conversation.status,
        },
        { status: 400 },
      );
    }

    // Parse metadata if it's a string
    const metadata =
      typeof conversation.metadata === "string"
        ? JSON.parse(conversation.metadata)
        : conversation.metadata;

    // Messages field is stored as JSON but may not be in generated Prisma types
    const conversationData = conversation as unknown as {
      messages?: unknown;
    };

    // Parse messages if it's a string (stored as JSON)
    const messages =
      typeof conversationData.messages === "string"
        ? JSON.parse(conversationData.messages)
        : conversationData.messages;

    // Ensure messages is an array
    const messageArray = Array.isArray(messages) ? messages : [];

    return NextResponse.json({
      id: conversation.id,
      companyId: conversation.companyId,
      workflowType: conversation.workflow,
      status: conversation.status,
      currentStep: 0, // Default since currentStep field doesn't exist in schema
      metadata,
      context: {}, // Default since context field doesn't exist in schema
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: messageArray.map((msg: any) => ({
        id: msg.id || String(Date.now()),
        role: msg.role || "user",
        content: msg.content || msg.message || "",
        metadata: msg.metadata || {},
        createdAt: msg.createdAt || new Date().toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversation" },
      { status: 500 },
    );
  }
}
