import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ConversationSummary {
  id: string;
  sessionId: string;
  workflow: string | null;
  status: "active" | "inactive";
  createdAt: string;
  companyName: string | null;
  lastActivity: string;
}

interface ConversationsResponse {
  success: boolean;
  conversations: ConversationSummary[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * GET /api/bot/conversations
 * Retrieve user's past conversations with pagination and filtering
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - status: Filter by status ('active' | 'inactive')
 * - workflow_type: Filter by workflow type
 * - company_name: Search by company name (partial match)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    // Parse filter parameters
    const statusFilter = searchParams.get("status") as
      | "active"
      | "inactive"
      | null;
    const workflowTypeFilter = searchParams.get("workflow_type");
    const companyNameSearch = searchParams.get("company_name");

    // Prisma client may not include newer models in generated types yet
    const prismaClient = prisma as any;

    // Build where clause for filtering
    const whereClause: any = {};

    // Filter by workflow type
    if (workflowTypeFilter) {
      whereClause.currentWorkflow = workflowTypeFilter;
    }

    // Filter by company name (search in metadata JSON field)
    if (companyNameSearch) {
      whereClause.metadata = {
        path: ["companyId"],
        string_contains: companyNameSearch,
      };
    }

    // Get total count for pagination
    const totalCount = await prismaClient.conversation.count({
      where: whereClause,
    });

    // Fetch conversations with their latest message for status determination
    const conversations = await prismaClient.conversation.findMany({
      where: whereClause,
      select: {
        id: true,
        sessionId: true,
        currentWorkflow: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            timestamp: true,
          },
          orderBy: {
            timestamp: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip,
      take: pageSize,
    });

    // Transform conversations to summaries
    const conversationSummaries: ConversationSummary[] = conversations.map(
      (conv: any) => {
        // Determine status based on last activity (active if within last 24 hours)
        const lastActivity = conv.messages[0]?.timestamp || conv.updatedAt;
        const daysSinceActivity =
          (Date.now() - new Date(lastActivity).getTime()) /
          (1000 * 60 * 60 * 24);
        const status: "active" | "inactive" =
          daysSinceActivity < 1 ? "active" : "inactive";

        // Extract company name from metadata
        let companyName: string | null = null;
        if (conv.metadata && typeof conv.metadata === "object") {
          companyName =
            (conv.metadata as any).companyId ||
            (conv.metadata as any).companyName ||
            null;
        }

        return {
          id: conv.id,
          sessionId: conv.sessionId,
          workflow: conv.currentWorkflow,
          status,
          createdAt: conv.createdAt.toISOString(),
          companyName,
          lastActivity: lastActivity.toISOString(),
        };
      },
    );

    // Apply status filter if provided (done after fetching since status is derived)
    let filteredSummaries = conversationSummaries;
    if (statusFilter) {
      filteredSummaries = conversationSummaries.filter(
        (conv) => conv.status === statusFilter,
      );
    }

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / pageSize);

    const response: ConversationsResponse = {
      success: true,
      conversations: filteredSummaries,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching conversations:", error);

    // Handle specific database errors
    if (error instanceof Error && error.message.includes("database")) {
      return NextResponse.json(
        {
          success: false,
          error: "Database error occurred. Please try again later.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch conversations",
      },
      { status: 500 },
    );
  }
}
