/**
 * LLM Service — Multi-provider abstraction for layout generation
 *
 * Supports Anthropic (Claude) and OpenAI.
 * Primary provider is configurable via LLM_PRIMARY_PROVIDER env var.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LayoutSection {
  id: string;
  type: "custom_html" | "built_in";
  /** For custom_html sections */
  html?: string;
  css?: string;
  /** For built_in sections */
  component?:
    | "HeaderSection"
    | "IntroSection"
    | "LocationInfo"
    | "EstimateCard"
    | "InventoryTable"
    | "NextStepsForm"
    | "AcceptanceForm"
    | "TermsSection";
  visible?: boolean;
  config?: Record<string, unknown>;
}

export interface LayoutConfig {
  version: number;
  globalStyles: {
    fontFamily: string;
    backgroundColor: string;
    maxWidth: string;
    customCss?: string;
  };
  sections: LayoutSection[];
}

export interface ReferenceFileData {
  data: string; // base64 encoded
  mediaType: string; // e.g., "application/pdf", "image/png"
  filename: string;
}

export interface GenerateLayoutInput {
  companyName: string;
  brandCode: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  logoUrl?: string;
  bannerImageUrl?: string;
  footerImageUrl?: string;
  referenceUrl?: string;
  referenceFileData?: ReferenceFileData | null; // PDF or image as base64
  referenceFileContent?: string; // deprecated: extracted text from PDF
  description: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface RefineLayoutInput {
  currentConfig: LayoutConfig;
  feedback: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const LAYOUT_SYSTEM_PROMPT = `You are an expert web designer that generates custom quote page layouts as JSON for moving companies. When given a reference image/PDF, you replicate its visual design exactly.

## Output Format

Return ONLY a valid JSON object (no markdown fences, no explanation text). The JSON must match this schema:

{
  "version": 1,
  "globalStyles": {
    "fontFamily": "Inter, sans-serif",
    "backgroundColor": "#f9fafb",
    "maxWidth": "1152px",
    "customCss": "/* optional global CSS */"
  },
  "sections": [
    { "id": "document", "type": "custom_html", "html": "<div>...</div>", "css": "", "visible": true }
  ]
}

## Strict Rendering Mode

FULL_CUSTOM_ONLY is enabled:
- Every section MUST use "type": "custom_html"
- Do NOT use built_in components
- Prefer a single full-document section (id: "document") that contains the full page markup from top to bottom

Write complete HTML with inline styles for precise replication.

## Template Variables (use in HTML with double-brace syntax)

Job: job.id, job.titleName, job.firstName, job.lastName, job.estimatedDeliveryDetails, job.jobValue, job.brandCode, job.branchCode
Addresses: job.upliftLine1, job.upliftLine2, job.upliftCity, job.upliftState, job.upliftPostcode, job.upliftCountry, job.deliveryLine1, job.deliveryLine2, job.deliveryCity, job.deliveryState, job.deliveryPostcode, job.deliveryCountry
Measures: job.measuresVolumeGrossM3, job.measuresWeightGrossKg
Branding: branding.companyName, branding.logoUrl, branding.primaryColor, branding.secondaryColor
Derived: customerName, quoteDate, expiryDate, totalCube

Loops (for arrays):
- Inventory loop syntax: {{#each inventory}} ... {{/each}}
- Costings loop syntax: {{#each costings}} ... {{/each}}
- Inventory row fields: this.description, this.room, this.quantity, this.cube, this.typeCode
- Costings row fields: this.id, this.name, this.description, this.quantity, this.rate, this.netTotal, this.totalPrice, this.taxIncluded, this.rawData.inclusions (array), this.rawData.exclusions (array)

Note: Template syntax uses double braces around variable names, and hash-each for loops, hash-slash-each to close loops.

## HTML Guidelines

- Use inline styles for precise color/layout control. Tailwind classes are also available.
- Logo: use branding.logoUrl variable, keep max height 48-64px, width auto.
- If bannerImageUrl or footerImageUrl is provided by user, use those exact URLs in img tags.
- Do not invent image URLs. For logos use branding.logoUrl. For other images (e.g. mascots), only use explicit URLs provided by the user; otherwise render a styled placeholder block.
- No script tags or event handlers (HTML is sanitised).
- All tags must be properly opened and closed.

## When Replicating a Reference Image

Study the image carefully. Replicate the visual design section by section:
1. Match the header design (colors, gradients, logo position, text layout)
2. Preserve the exact section order from top to bottom
3. Match colors, spacing, typography, and layout structure
4. Use the same column layouts (grid/flex) as the reference
5. Match table styling if present (header colors, row styling, borders)
6. Do NOT add creative improvements — copy what you see
`;

// ---------------------------------------------------------------------------
// Provider clients (lazy initialisation)
// ---------------------------------------------------------------------------

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// ---------------------------------------------------------------------------
// Call LLM
// ---------------------------------------------------------------------------

async function callAnthropic(
  systemPrompt: string,
  userMessage: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  referenceFileData?: ReferenceFileData | null,
): Promise<string> {
  try {
    const client = getAnthropicClient();
    console.log("[Anthropic] Starting API call...");

    const messages: Anthropic.MessageParam[] = [];

  // Add conversation history
  if (conversationHistory) {
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Build current message content with optional document/image
  const messageContent: Anthropic.MessageParam["content"] = [];
  
  // Add reference file if provided (PDF or image)
  if (referenceFileData) {
    const dataSizeKB = (referenceFileData.data.length / 1024).toFixed(2);
    const dataSizeMB = (referenceFileData.data.length / 1024 / 1024).toFixed(2);
    console.log(`[Anthropic] Adding reference file: ${referenceFileData.filename} (${referenceFileData.mediaType}, ${dataSizeKB}KB / ${dataSizeMB}MB base64)`);
    
    if (referenceFileData.mediaType === "application/pdf") {
      // Check if PDF is within Claude's limits (max ~32MB base64)
      if (referenceFileData.data.length > 30 * 1024 * 1024) {
        console.warn(`[Anthropic] PDF is too large (${dataSizeMB}MB). Skipping document attachment.`);
      } else {
        console.log(`[Anthropic] Attaching PDF document to message`);
        messageContent.push({
          type: "document" as const,
          source: {
            type: "base64" as const,
            media_type: "application/pdf" as const,
            data: referenceFileData.data,
          },
        });
      }
    } else if (referenceFileData.mediaType.startsWith("image/")) {
      console.log(`[Anthropic] Attaching image to message`);
      messageContent.push({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: referenceFileData.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: referenceFileData.data,
        },
      });
    } else {
      console.warn(`[Anthropic] Unsupported media type: ${referenceFileData.mediaType}. Skipping attachment.`);
    }
    
    console.log(`[Anthropic] Message content blocks: ${messageContent.length} (expecting ${referenceFileData ? 2 : 1})`);
  } else {
    console.log(`[Anthropic] No reference file attached`);
  }
  
  // Add text message
  messageContent.push({
    type: "text" as const,
    text: userMessage,
  });

  messages.push({ role: "user", content: messageContent });

  console.log("[Anthropic] Sending request to Claude API...");
  console.log(`[Anthropic] Message content blocks: ${JSON.stringify(messageContent.map(b => b.type))}`);
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 32768,
    system: systemPrompt,
    messages,
  });

  console.log("[Anthropic] Received response from Claude API");
  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
  } catch (error) {
    console.error("[Anthropic] API call failed:", error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes("401") || error.message.includes("authentication")) {
        throw new Error("AI API authentication failed. Please check your ANTHROPIC_API_KEY in .env file.");
      }
      if (error.message.includes("429") || error.message.includes("rate limit")) {
        throw new Error("AI API rate limit exceeded. Please try again in a few moments.");
      }
      if (error.message.includes("quota") || error.message.includes("insufficient")) {
        throw new Error("AI API quota exceeded. Please check your Anthropic account credits.");
      }
    }
    
    throw error;
  }
}

async function callOpenAI(
  systemPrompt: string,
  userMessage: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  referenceFileData?: ReferenceFileData | null,
): Promise<string> {
  const client = getOpenAIClient();

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
  ];

  if (conversationHistory) {
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  // Add current user message. If an image reference is available, attach it.
  if (referenceFileData && referenceFileData.mediaType.startsWith("image/")) {
    const dataUrl = `data:${referenceFileData.mediaType};base64,${referenceFileData.data}`;
    messages.push({
      role: "user",
      content: [
        { type: "text", text: userMessage },
        {
          type: "image_url",
          image_url: {
            url: dataUrl,
            detail: "high",
          },
        },
      ],
    } as OpenAI.ChatCompletionUserMessageParam);
  } else {
    messages.push({ role: "user", content: userMessage });
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 8192,
    messages,
    response_format: { type: "json_object" },
  });

  return response.choices[0]?.message?.content || "";
}

async function callLLM(
  systemPrompt: string,
  userMessage: string,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  referenceFileData?: ReferenceFileData | null,
): Promise<string> {
  const provider = (
    process.env.LLM_PRIMARY_PROVIDER || "anthropic"
  ).toLowerCase();
  const hasImageReference = !!(
    referenceFileData && referenceFileData.mediaType.startsWith("image/")
  );

  try {
    // Image-first routing: OpenAI vision generally performs better for screenshot replication.
    if (hasImageReference) {
      console.log("[LLM] Image reference detected, preferring OpenAI vision path");
      return await callOpenAI(
        systemPrompt,
        userMessage,
        conversationHistory,
        referenceFileData,
      );
    }

    if (provider === "openai") {
      // OpenAI doesn't support PDF documents, only images
      if (referenceFileData && !referenceFileData.mediaType.startsWith("image/")) {
        console.warn("[LLM] OpenAI does not support PDF documents, falling back to Anthropic");
        return await callAnthropic(systemPrompt, userMessage, conversationHistory, referenceFileData);
      }
      return await callOpenAI(
        systemPrompt,
        userMessage,
        conversationHistory,
        referenceFileData,
      );
    }
    return await callAnthropic(systemPrompt, userMessage, conversationHistory, referenceFileData);
  } catch (primaryError) {
    console.warn(`Primary LLM (${provider}) failed, trying fallback:`, primaryError);

    // Try fallback provider
    try {
      if (provider === "openai") {
        return await callAnthropic(
          systemPrompt,
          userMessage,
          conversationHistory,
          referenceFileData,
        );
      }
      return await callOpenAI(
        systemPrompt,
        userMessage,
        conversationHistory,
        referenceFileData,
      );
    } catch (fallbackError) {
      console.error("Both LLM providers failed:", fallbackError);
      throw new Error(
        "AI service unavailable. Please check your API keys and try again.",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Extract JSON from LLM response (handles markdown fences)
// ---------------------------------------------------------------------------

function extractJSON(text: string): string {
  console.log("[LLM Service] AI response length:", text.length);

  // 1. Try markdown code fence first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    console.log("[LLM Service] Extracted JSON from code fence");
    return fenceMatch[1].trim();
  }

  // 2. Find a JSON object that starts with {"version" — this is our expected schema
  const schemaMatch = text.match(/\{\s*"version"\s*:[\s\S]*\}/);
  if (schemaMatch) {
    console.log("[LLM Service] Extracted JSON starting from version key");
    return schemaMatch[0];
  }

  // 3. Find a JSON object starting with {"globalStyles" as fallback
  const globalMatch = text.match(/\{\s*"globalStyles"\s*:[\s\S]*\}/);
  if (globalMatch) {
    console.log("[LLM Service] Extracted JSON starting from globalStyles key");
    return globalMatch[0];
  }

  // 4. Find the last complete JSON object by scanning for balanced braces
  //    This avoids capturing stray { } from analysis/explanation text
  const lastBrace = text.lastIndexOf("}");
  if (lastBrace !== -1) {
    let depth = 0;
    let start = -1;
    for (let i = lastBrace; i >= 0; i--) {
      if (text[i] === "}") depth++;
      if (text[i] === "{") depth--;
      if (depth === 0) {
        start = i;
        break;
      }
    }
    if (start !== -1) {
      const candidate = text.substring(start, lastBrace + 1);
      try {
        JSON.parse(candidate);
        console.log("[LLM Service] Extracted JSON via brace balancing");
        return candidate;
      } catch {
        // Not valid JSON, fall through
      }
    }
  }

  // 5. Last resort — greedy match
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    console.log("[LLM Service] Extracted JSON via greedy match (fallback)");
    return jsonMatch[0];
  }

  console.warn("[LLM Service] Could not find JSON in response");
  return text.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateLayout(
  input: GenerateLayoutInput,
): Promise<LayoutConfig & { _urlCaptureError?: string }> {
  const { prompt: userMessage, screenshotData, urlCaptureError } = await buildGeneratePrompt(input);
  
  // Use screenshot from URL if available, otherwise use uploaded file
  const referenceData = screenshotData || input.referenceFileData;
  
  console.log(`[generateLayout] Has visual reference: ${!!referenceData}`);
  console.log(`[generateLayout] URL capture error: ${urlCaptureError || 'none'}`);
  
  const raw = await callLLM(
    LAYOUT_SYSTEM_PROMPT,
    userMessage,
    input.conversationHistory,
    referenceData,
  );
  const json = extractJSON(raw);

  try {
    const config = JSON.parse(json) as LayoutConfig & { _urlCaptureError?: string };
    config.version = config.version || 1;

    // Validate the config has required fields
    if (!config.sections || !Array.isArray(config.sections)) {
      throw new Error("AI response is missing 'sections' array");
    }
    if (!config.globalStyles) {
      config.globalStyles = {
        fontFamily: "Inter, sans-serif",
        backgroundColor: "#ffffff",
        maxWidth: "1152px",
      };
    }

    // Enforce full-custom mode: keep only custom_html sections.
    // This avoids falling back to default built-in quote blocks.
    const originalCount = config.sections.length;
    config.sections = config.sections.filter((section) => section.type === "custom_html");
    if (config.sections.length === 0) {
      throw new Error("AI response did not contain any custom_html sections");
    }
    if (config.sections.length !== originalCount) {
      console.warn(
        `[generateLayout] Removed ${originalCount - config.sections.length} built_in section(s) to enforce full-custom rendering mode.`,
      );
    }
    
    // Attach URL capture error so the API route can warn the user
    if (urlCaptureError) {
      config._urlCaptureError = urlCaptureError;
    }
    
    return config;
  } catch (parseError) {
    console.error("[generateLayout] JSON parse failed. First 500 chars of extracted JSON:", json.substring(0, 500));
    console.error("[generateLayout] Last 200 chars:", json.substring(json.length - 200));
    const msg = parseError instanceof Error ? parseError.message : "Unknown parse error";
    throw new Error(`AI returned invalid JSON: ${msg}. Please try again.`);
  }
}

export async function refineLayout(
  input: RefineLayoutInput,
): Promise<LayoutConfig> {
  const userMessage = `The user wants to update the layout. Here is their feedback:

"${input.feedback}"

Here is the CURRENT layout config JSON that needs to be modified:

${JSON.stringify(input.currentConfig, null, 2)}

Company: ${input.companyName}
Primary Color: ${input.primaryColor}
Secondary Color: ${input.secondaryColor}

Return the UPDATED layout config JSON incorporating the user's feedback.
Constraints:
- Use custom_html sections only (no built_in sections)
- Keep the layout as a full custom document structure
Return ONLY the JSON.`;

  const raw = await callLLM(
    LAYOUT_SYSTEM_PROMPT,
    userMessage,
    input.conversationHistory,
  );
  const json = extractJSON(raw);

  try {
    const config = JSON.parse(json) as LayoutConfig;
    config.version = config.version || 1;
    return config;
  } catch {
    throw new Error("AI returned invalid JSON during refinement. Please try again.");
  }
}

/**
 * Chat with the AI about the layout — returns a text response (not JSON).
 * Used for Q&A, clarifications, suggestions.
 */
export async function chatAboutLayout(
  message: string,
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>,
  companyName: string,
): Promise<string> {
  const chatSystemPrompt = `You are an AI assistant helping a Moveware staff member design a custom quote page layout for "${companyName}". 

You can answer questions about layout options, make suggestions, and discuss design choices. When the user is ready to generate or update a layout, let them know they can click the "Generate Layout" or "Update Preview" button.

Keep responses concise and helpful. Focus on web design, branding, and user experience.`;

  return callLLM(chatSystemPrompt, message, conversationHistory);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch the HTML content and screenshot from a reference URL using browser automation
 * Falls back gracefully if browser automation fails
 */
async function fetchReferenceContent(url: string): Promise<{
  html: string | null;
  screenshot: Buffer | null;
  error?: string;
}> {
  try {
    console.log(`[LLM Service] Capturing reference URL with browser: ${url}`);
    
    // Check if Playwright is available
    let captureUrl;
    try {
      const browserService = await import("@/lib/services/browser-service");
      captureUrl = browserService.captureUrl;
      console.log(`[LLM Service] Browser service loaded successfully`);
    } catch (importError) {
      console.warn(`[LLM Service] Browser service not available (Playwright not installed?):`, importError);
      return {
        html: null,
        screenshot: null,
        error: "Browser automation not available. Please install Playwright: npm install && npx playwright install chromium",
      };
    }
    
    // Use browser service for better rendering (handles auth, CORS, JS)
    const result = await captureUrl(url);
    
    if (result.error) {
      console.warn(`[LLM Service] Browser capture failed: ${result.error}`);
      return {
        html: null,
        screenshot: null,
        error: result.error,
      };
    }
    
    console.log(`[LLM Service] Successfully captured URL - HTML: ${result.html ? (result.html.length / 1024).toFixed(2) : 0}KB, Screenshot: ${result.screenshot ? (result.screenshot.length / 1024).toFixed(2) : 0}KB`);
    
    // Limit HTML to 50KB to avoid token limits
    const html = result.html ? result.html.substring(0, 50000) : null;
    
    return {
      html,
      screenshot: result.screenshot,
    };
  } catch (error) {
    const errorMsg = `Error capturing reference URL: ${error instanceof Error ? error.message : String(error)}`;
    console.error(`[LLM Service] ${errorMsg}`, error);
    return {
      html: null,
      screenshot: null,
      error: errorMsg,
    };
  }
}

async function buildGeneratePrompt(input: GenerateLayoutInput): Promise<{
  prompt: string;
  screenshotData: ReferenceFileData | null;
  urlCaptureError: string | null;
}> {
  const parts: string[] = [];

  parts.push(`Generate a custom quote page layout JSON for:`);
  parts.push(`Company: ${input.companyName} (Brand Code: ${input.brandCode})`);
  parts.push(`Primary Color: ${input.primaryColor}`);
  parts.push(`Secondary Color: ${input.secondaryColor}`);
  if (input.tertiaryColor) parts.push(`Tertiary Color: ${input.tertiaryColor}`);
  if (input.logoUrl) parts.push(`Logo URL: ${input.logoUrl}`);
  if (input.bannerImageUrl) parts.push(`Banner Image URL: ${input.bannerImageUrl}`);
  if (input.footerImageUrl) parts.push(`Footer Image URL: ${input.footerImageUrl}`);

  if (input.description) {
    parts.push(`\nUser's Description:\n${input.description}`);
  }

  const hasUploadedFile = !!input.referenceFileData;

  if (hasUploadedFile) {
    const fileType = input.referenceFileData!.mediaType === "application/pdf" ? "PDF" : "image";
    parts.push(`\nA reference ${fileType} is attached. Study it carefully and replicate the layout you see — match the header design, section order, colors, spacing, and structure exactly. Do not add creative improvements.`);
  }

  let screenshotData: ReferenceFileData | null = null;
  let urlCaptureError: string | null = null;

  if (input.referenceUrl) {
    const { html: referenceContent, screenshot, error: fetchError } = await fetchReferenceContent(input.referenceUrl);

    if (screenshot) {
      const base64Screenshot = screenshot.toString("base64");
      screenshotData = {
        data: base64Screenshot,
        mediaType: "image/png",
        filename: "reference-screenshot.png",
      };
      console.log(`[LLM Service] Captured screenshot of reference URL (${(base64Screenshot.length / 1024).toFixed(2)}KB)`);
      parts.push(`\nA screenshot of the reference URL (${input.referenceUrl}) is attached. Replicate its layout exactly.`);
    }

    if (referenceContent) {
      const truncatedHtml = referenceContent.substring(0, 30000);
      parts.push(`\nReference HTML source:\n\`\`\`html\n${truncatedHtml}\n\`\`\`\nUse this HTML to understand the exact structure, colors, and styles.`);
    }

    if (!screenshot && !referenceContent) {
      urlCaptureError = fetchError || "unknown error";
      console.error(`[LLM Service] Cannot fetch reference URL. Error: ${urlCaptureError}`);
      parts.push(`\nNote: Could not capture the reference URL (${urlCaptureError}). Rely on the user's description instead.`);
    }
  }

  if (input.referenceFileContent) {
    parts.push(`\nExtracted text from reference PDF:\n${input.referenceFileContent.substring(0, 5000)}`);
  }

  parts.push(`\nImportant output constraints:
- Return ONLY the JSON object
- Use custom_html sections only (no built_in sections)
- Prefer one full-page custom_html section with all content in order
- If Banner Image URL is provided, include it in the header/hero area using that exact URL
- If Footer Image URL is provided, include it near the bottom/footer area using that exact URL`);

  return { prompt: parts.join("\n"), screenshotData, urlCaptureError };
}
