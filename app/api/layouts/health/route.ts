/**
 * Health check endpoint for layout generation system
 * GET /api/layouts/health - Check if all dependencies are available
 */

import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    anthropic: false,
    openai: false,
    playwright: false,
    anthropicError: null as string | null,
    openaiError: null as string | null,
    playwrightError: null as string | null,
  };

  // Check Anthropic
  try {
    const hasKey = !!process.env.ANTHROPIC_API_KEY;
    checks.anthropic = hasKey;
    if (!hasKey) {
      checks.anthropicError = "ANTHROPIC_API_KEY not set in environment";
    }
  } catch (error) {
    checks.anthropicError = error instanceof Error ? error.message : String(error);
  }

  // Check OpenAI
  try {
    const hasKey = !!process.env.OPENAI_API_KEY;
    checks.openai = hasKey;
    if (!hasKey) {
      checks.openaiError = "OPENAI_API_KEY not set in environment";
    }
  } catch (error) {
    checks.openaiError = error instanceof Error ? error.message : String(error);
  }

  // Check Playwright
  try {
    await import("playwright");
    checks.playwright = true;
  } catch (error) {
    checks.playwrightError = "Playwright not installed. Run: npm install && npx playwright install chromium";
  }

  const isHealthy = checks.anthropic || checks.openai;

  return NextResponse.json({
    healthy: isHealthy,
    checks,
    recommendations: [
      ...(!checks.anthropic && !checks.openai
        ? ["Install at least one LLM provider (Anthropic or OpenAI)"]
        : []),
      ...(!checks.playwright
        ? ["Install Playwright for URL screenshot capture (optional but recommended)"]
        : []),
    ],
  });
}
