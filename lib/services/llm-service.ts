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

const LAYOUT_SYSTEM_PROMPT = `You are an expert web designer specialising in creating custom quote page layouts for moving companies. You generate layout configurations as JSON that a renderer will use to build the page.

⚠️ CRITICAL INSTRUCTION: When a user provides a REFERENCE FILE (PDF/image), REFERENCE URL, or REFERENCE HTML, your PRIMARY GOAL is to MATCH that layout EXACTLY. 

**If a reference file/image is attached:** Study it carefully and replicate EVERY visual detail - header design, section order, colors, spacing, typography, card styles, etc. This is your PRIMARY source of truth.

**If reference HTML is provided:** Analyze the structure and styling precisely.

Do NOT be creative or add your own design touches. Your job is to REPLICATE, not to design.

## Available Data Variables (use in HTML with {{variable}} syntax)

### Job Data
- {{job.id}} — Job reference number
- {{job.titleName}} — e.g. "Mr"
- {{job.firstName}}, {{job.lastName}}
- {{job.estimatedDeliveryDetails}} — e.g. "27/02/2026"
- {{job.jobValue}} — numeric value
- {{job.brandCode}}, {{job.branchCode}}

### Addresses
- {{job.upliftLine1}}, {{job.upliftLine2}}, {{job.upliftCity}}, {{job.upliftState}}, {{job.upliftPostcode}}, {{job.upliftCountry}}
- {{job.deliveryLine1}}, {{job.deliveryLine2}}, {{job.deliveryCity}}, {{job.deliveryState}}, {{job.deliveryPostcode}}, {{job.deliveryCountry}}

### Measures
- {{job.measuresVolumeGrossM3}}, {{job.measuresWeightGrossKg}}

### Branding
- {{branding.companyName}}, {{branding.logoUrl}}, {{branding.primaryColor}}, {{branding.secondaryColor}}

### Derived
- {{customerName}} — Full name: "Mr Leigh Morrow"
- {{quoteDate}}, {{expiryDate}} — formatted DD/MM/YYYY
- {{totalCube}} — sum of inventory cubes

### Inventory Array
Use {{#each inventory}} ... {{/each}} to iterate:
- {{this.description}}, {{this.room}}, {{this.quantity}}, {{this.cube}}, {{this.typeCode}}

### Costings Array
Use {{#each costings}} ... {{/each}} to iterate:
- {{this.id}}, {{this.name}}, {{this.description}}, {{this.quantity}}, {{this.rate}}, {{this.netTotal}}, {{this.totalPrice}}, {{this.taxIncluded}}
- {{this.rawData.inclusions}} (array), {{this.rawData.exclusions}} (array)

## Available Built-in Components

These are pre-built React components. Use them for interactive/complex sections:

1. **HeaderSection** — Company logo, quote title, customer details. Config: { showBanner: boolean, bannerImageUrl: string }
2. **IntroSection** — Welcome letter / introduction text. Config: { template: "letter" | "brief" | "custom", customText: string }
3. **LocationInfo** — Origin and destination addresses. Config: { layout: "two-column" | "stacked" }
4. **EstimateCard** — Pricing/costing display with select button. (rendered per costing item)
5. **InventoryTable** — Paginated inventory table. Config: { defaultPageSize: number, showRoom: boolean, showType: boolean }
6. **NextStepsForm** — The 3-step animated indicator + form fields (signature name, date, etc.)
7. **AcceptanceForm** — Signature canvas, terms checkbox, accept/decline buttons.
8. **TermsSection** — Terms and conditions list.

## JSON Schema

Return ONLY valid JSON matching this structure:
{
  "version": 1,
  "globalStyles": {
    "fontFamily": "Inter",
    "backgroundColor": "#f9fafb",
    "maxWidth": "1152px",
    "customCss": "/* optional global CSS overrides */"
  },
  "sections": [
    {
      "id": "unique-id",
      "type": "custom_html" | "built_in",
      "html": "HTML with {{variables}} (only for custom_html)",
      "css": "scoped CSS (only for custom_html)",
      "component": "ComponentName (only for built_in)",
      "visible": true,
      "config": {}
    }
  ]
}

## Rules
1. ALWAYS include AcceptanceForm as the second-to-last section — this is required for quote acceptance.
2. ALWAYS include TermsSection as the last section.
3. For custom_html sections, use Tailwind CSS classes where possible. Inline styles are also fine.
4. Use the company's brand colours throughout the design.
5. Make layouts professional, clean, and modern.
6. All HTML must be safe — no <script> tags or event handlers.
7. Return ONLY the JSON object — no markdown fences, no explanation.
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
    console.log(`[LLM] Adding reference file to prompt: ${referenceFileData.filename} (${referenceFileData.mediaType})`);
    
    if (referenceFileData.mediaType === "application/pdf") {
      messageContent.push({
        type: "document" as const,
        source: {
          type: "base64" as const,
          media_type: "application/pdf" as const,
          data: referenceFileData.data,
        },
      });
    } else if (referenceFileData.mediaType.startsWith("image/")) {
      messageContent.push({
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: referenceFileData.mediaType as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
          data: referenceFileData.data,
        },
      });
    }
  }
  
  // Add text message
  messageContent.push({
    type: "text" as const,
    text: userMessage,
  });

  messages.push({ role: "user", content: messageContent });

  console.log("[Anthropic] Sending request to Claude API...");
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
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

  messages.push({ role: "user", content: userMessage });

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

  try {
    if (provider === "openai") {
      // OpenAI doesn't support PDF documents, only images
      if (referenceFileData && !referenceFileData.mediaType.startsWith("image/")) {
        console.warn("[LLM] OpenAI does not support PDF documents, falling back to Anthropic");
        return await callAnthropic(systemPrompt, userMessage, conversationHistory, referenceFileData);
      }
      return await callOpenAI(systemPrompt, userMessage, conversationHistory);
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
      return await callOpenAI(systemPrompt, userMessage, conversationHistory);
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
  // Strip markdown code fences if present
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find a JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) return jsonMatch[0];

  return text.trim();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateLayout(
  input: GenerateLayoutInput,
): Promise<LayoutConfig> {
  const { prompt: userMessage, screenshotData } = await buildGeneratePrompt(input);
  
  // Use screenshot from URL if available, otherwise use uploaded file
  const referenceData = screenshotData || input.referenceFileData;
  
  const raw = await callLLM(
    LAYOUT_SYSTEM_PROMPT,
    userMessage,
    input.conversationHistory,
    referenceData,
  );
  const json = extractJSON(raw);

  try {
    const config = JSON.parse(json) as LayoutConfig;
    // Ensure version
    config.version = config.version || 1;
    return config;
  } catch {
    throw new Error("AI returned invalid JSON. Please try again.");
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

Return the UPDATED layout config JSON incorporating the user's feedback. Return ONLY the JSON.`;

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
}> {
  let prompt = `Generate a custom quote page layout for the following company:

**Company:** ${input.companyName} (Brand Code: ${input.brandCode})
**Primary Color:** ${input.primaryColor}
**Secondary Color:** ${input.secondaryColor}`;

  if (input.tertiaryColor) {
    prompt += `\n**Tertiary Color:** ${input.tertiaryColor}`;
  }
  if (input.logoUrl) {
    prompt += `\n**Logo URL:** ${input.logoUrl}`;
  }

  prompt += `\n\n**User's Description:**\n${input.description}`;

  // Reference file (PDF or image)
  if (input.referenceFileData) {
    prompt += `\n\n**📄 REFERENCE FILE PROVIDED:**
I have attached a reference ${input.referenceFileData.mediaType === "application/pdf" ? "PDF document" : "image"} (${input.referenceFileData.filename}) that shows the exact layout you need to match.

⚠️ **CRITICAL**: Study this document/image VERY CAREFULLY. This is the exact layout the user wants. You MUST replicate:
- The EXACT header design (colors, gradients, logo placement, text layout)
- The PRECISE section order and structure
- The EXACT styling (fonts, colors, spacing, borders, shadows)
- The SPECIFIC layout of each section (columns, cards, grids)

Analyze every detail in this reference and match it precisely. The user's description provides additional context, but the visual reference is the PRIMARY source of truth.`;
  }

  let screenshotData: ReferenceFileData | null = null;

  if (input.referenceUrl) {
    // Fetch the actual reference content with browser automation
    const { html: referenceContent, screenshot, error: fetchError } = await fetchReferenceContent(input.referenceUrl);
    
    prompt += `\n\n**📸 REFERENCE LAYOUT FROM URL:**
**Reference URL:** ${input.referenceUrl}

⚠️ CRITICAL: The user has provided a reference layout that you MUST match as closely as possible. This is not a suggestion or inspiration - you MUST replicate the layout structure, sections, and styling from the reference URL.`;

    // If we got a screenshot, prepare it for the AI
    if (screenshot) {
      const base64Screenshot = screenshot.toString("base64");
      screenshotData = {
        data: base64Screenshot,
        mediaType: "image/png",
        filename: "reference-screenshot.png",
      };
      console.log(`[LLM Service] Captured screenshot of reference URL (${(base64Screenshot.length / 1024).toFixed(2)}KB)`);
      
      prompt += `\n\n**I have captured a SCREENSHOT of the reference URL** which is attached to this message. Study it VERY CAREFULLY and replicate the exact visual design you see.`;
    }

    if (referenceContent) {
      prompt += `\n\n**REFERENCE HTML CONTENT:**
I have also fetched the HTML from the reference URL. Use this to understand the structure:

\`\`\`html
${referenceContent}
\`\`\`

Analyze both the SCREENSHOT (primary) and HTML to determine:
- The EXACT order and structure of sections
- Header design and styling (colors, gradients, layout)
- Section arrangement and spacing
- Typography and text alignment
- Color scheme (look for color values in styles)
- Card/box styling (borders, shadows, padding)
- Use of custom HTML vs. built-in components`;
    }

    if (!screenshot && !referenceContent) {
      console.error(`[LLM Service] Cannot fetch reference URL, relying on description. Error: ${fetchError}`);
      prompt += `\n\n⚠️ Note: I was unable to capture the reference URL (${fetchError || 'unknown error'}). 
      
The URL may require authentication or have CORS restrictions. I will rely ENTIRELY on the user's description to match the layout.

IMPORTANT: The user MUST provide a VERY DETAILED description including all visual and structural details.`;
    }
  }

  if (input.referenceFileContent) {
    prompt += `\n\n**Reference Document Content (extracted from PDF):**\n${input.referenceFileContent.substring(0, 5000)}\n\nUse this content to understand the exact layout structure and match it precisely.`;
  }

  const hasVisualReference = screenshotData || input.referenceFileData;
  prompt += `\n\nGenerate a complete layout config JSON that ${hasVisualReference ? 'EXACTLY MATCHES the visual reference provided' : 'follows the description'}. Return ONLY the JSON.`;

  return { prompt, screenshotData };
}
