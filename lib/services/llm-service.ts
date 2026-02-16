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

export interface GenerateLayoutInput {
  companyName: string;
  brandCode: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  logoUrl?: string;
  referenceUrl?: string;
  referenceFileContent?: string; // extracted text from PDF
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

⚠️ CRITICAL INSTRUCTION: When a user provides a REFERENCE URL or REFERENCE FILE, your PRIMARY GOAL is to MATCH that layout EXACTLY. Do not be creative or add your own design touches. Replicate the structure, colors, sections, and styling as precisely as possible based on the user's description of the reference.

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
): Promise<string> {
  const client = getAnthropicClient();

  const messages: Anthropic.MessageParam[] = [];

  // Add conversation history
  if (conversationHistory) {
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  // Add current user message
  messages.push({ role: "user", content: userMessage });

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
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
): Promise<string> {
  const provider = (
    process.env.LLM_PRIMARY_PROVIDER || "anthropic"
  ).toLowerCase();

  try {
    if (provider === "openai") {
      return await callOpenAI(systemPrompt, userMessage, conversationHistory);
    }
    return await callAnthropic(systemPrompt, userMessage, conversationHistory);
  } catch (primaryError) {
    console.warn(`Primary LLM (${provider}) failed, trying fallback:`, primaryError);

    // Try fallback provider
    try {
      if (provider === "openai") {
        return await callAnthropic(
          systemPrompt,
          userMessage,
          conversationHistory,
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
  const userMessage = await buildGeneratePrompt(input);
  const raw = await callLLM(
    LAYOUT_SYSTEM_PROMPT,
    userMessage,
    input.conversationHistory,
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
 * Fetch the HTML content from a reference URL
 */
async function fetchReferenceContent(url: string): Promise<{ html: string | null; error?: string }> {
  try {
    console.log(`[LLM Service] Fetching reference URL: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    if (!response.ok) {
      const error = `Failed to fetch reference URL: HTTP ${response.status} ${response.statusText}`;
      console.warn(`[LLM Service] ${error}`);
      return { html: null, error };
    }
    const html = await response.text();
    console.log(`[LLM Service] Successfully fetched ${html.length} characters from reference URL`);
    // Limit to first 50KB to avoid token limits
    return { html: html.substring(0, 50000) };
  } catch (error) {
    const errorMsg = `Error fetching reference URL: ${error instanceof Error ? error.message : String(error)}`;
    console.warn(`[LLM Service] ${errorMsg}`);
    return { html: null, error: errorMsg };
  }
}

async function buildGeneratePrompt(input: GenerateLayoutInput): Promise<string> {
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

  if (input.referenceUrl) {
    // Fetch the actual reference content
    const { html: referenceContent, error: fetchError } = await fetchReferenceContent(input.referenceUrl);
    
    prompt += `\n\n**IMPORTANT - REFERENCE LAYOUT TO MATCH:**
**Reference URL:** ${input.referenceUrl}

⚠️ CRITICAL: The user has provided a reference layout that you MUST match as closely as possible. This is not a suggestion or inspiration - you MUST replicate the layout structure, sections, and styling from the reference URL.`;

    if (referenceContent) {
      prompt += `\n\n**REFERENCE HTML CONTENT:**
I have fetched the actual HTML from the reference URL. Study this carefully to understand the exact layout structure:

\`\`\`html
${referenceContent}
\`\`\`

Analyze the HTML to determine:
- The EXACT order and structure of sections
- Header design and styling (inline styles, CSS classes, gradients, colors)
- Section arrangement and spacing
- Typography and text alignment
- Color scheme (look for color values in styles)
- Card/box styling (borders, shadows, padding)
- Use of custom HTML vs. built-in components

The user's description provides additional context. Use BOTH the HTML content and the description to create an exact match.`;
    } else {
      console.error(`[LLM Service] Cannot fetch reference URL, relying on description. Error: ${fetchError}`);
      prompt += `\n\n⚠️ Note: I was unable to fetch the reference URL content automatically (${fetchError || 'unknown error'}). 
      
The URL may require authentication or have CORS restrictions. I will rely ENTIRELY on the user's description to match the layout.

IMPORTANT: The user MUST provide a VERY DETAILED description including:
- The EXACT order and structure of sections
- Header design and styling (colors, gradients, layout, logo placement)
- Section arrangement and spacing
- Typography and text alignment
- Color scheme with specific hex codes
- Card/box styling (borders, shadows, padding)
- Any custom HTML sections vs built-in components used

Without the HTML content, an accurate match depends on the description quality.`;
    }
  }

  if (input.referenceFileContent) {
    prompt += `\n\n**Reference Document Content (extracted from PDF):**\n${input.referenceFileContent.substring(0, 5000)}\n\nUse this content to understand the exact layout structure and match it precisely.`;
  }

  prompt += `\n\nGenerate a complete layout config JSON that ${input.referenceUrl ? 'MATCHES the reference layout exactly' : 'follows the description'}. Return ONLY the JSON.`;

  return prompt;
}
