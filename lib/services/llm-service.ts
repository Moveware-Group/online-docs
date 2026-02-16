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

🚨 CRITICAL INSTRUCTION - EXACT REPLICATION REQUIRED 🚨

When a user provides a REFERENCE FILE (PDF/image), REFERENCE URL screenshot, or REFERENCE HTML, you are NOT designing - you are REPLICATING.

**YOUR ONLY JOB IS TO COPY THE REFERENCE LAYOUT EXACTLY. ANY DEVIATION IS WRONG.**

## How to Analyze a Reference Layout (Screenshot/PDF/Image):

1. **HEADER (Top of page):**
   - Note EXACT colors, gradients (direction and colors)
   - Logo position (left/center/right) and size
   - Text layout, font sizes, alignment
   - Quote number, date, customer name positions

2. **SECTIONS (In exact order from top to bottom):**
   - Count and list all sections
   - Note the EXACT order
   - Identify section types (text, table, form, cards, etc.)
   
3. **STYLING (Colors, spacing, typography):**
   - Exact color values from the design
   - Font sizes and weights
   - Spacing between sections
   - Card/box styling (borders, shadows, padding)
   - Background colors

4. **LAYOUT STRUCTURE:**
   - Single column or multi-column
   - Card-based or continuous
   - Table layouts
   - Form arrangements

**If reference HTML is provided:** Extract the EXACT structure, classes, and inline styles. Copy them.

**NEVER** add creative touches, modern improvements, or "better" designs. REPLICATE EXACTLY.

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

## Important: Custom HTML vs Built-in Components

When replicating a reference layout:
- **Use custom_html sections for EVERYTHING except the few built-in components below**
- Built-in components have their own styling that usually WON'T match the reference
- For headers → ALWAYS use custom_html (built-in HeaderSection won't match custom designs)
- For intro/welcome text → ALWAYS use custom_html
- For location info → ALWAYS use custom_html (built-in LocationInfo may not match)
- For pricing/estimates → ALWAYS use custom_html  
- For summary cards → ALWAYS use custom_html
- **Only use these built-in components:**
  - **InventoryTable** — for the inventory/items list (it has pagination built in)
  - **AcceptanceForm** — REQUIRED for quote acceptance (signature, form fields)
  - **TermsSection** — for terms and conditions

## Critical HTML Guidelines for custom_html sections:

1. **Header sections**: Use inline styles or Tailwind classes for gradients. Example:
   \`<div style="background: linear-gradient(to right, #dc2626, #7c3aed);" class="p-8">\`

2. **Logo images**: Use the {{branding.logoUrl}} variable. Keep logos appropriately sized:
   \`<img src="{{branding.logoUrl}}" alt="{{branding.companyName}}" class="h-12 w-auto" />\`
   NEVER make the logo fill the entire width. Logos should be max 200px wide.

3. **Card layouts**: Use Tailwind grid/flex classes:
   \`<div class="grid grid-cols-2 gap-6">\`

4. **Colors**: Use the exact colors from the reference, specified with inline styles when Tailwind classes aren't precise enough.

5. **All HTML must be complete**: Include opening AND closing tags. No fragments.
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
    
    // Attach URL capture error so the API route can warn the user
    if (urlCaptureError) {
      config._urlCaptureError = urlCaptureError;
    }
    
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
  urlCaptureError: string | null;
}> {
  let prompt = `Generate a custom quote page layout for the following company:

**Company:** ${input.companyName} (Brand Code: ${input.brandCode})
**Primary Color:** ${input.primaryColor}
**Secondary Color:** ${input.secondaryColor}

⚠️ IMPORTANT REMINDERS:
- For the HEADER: use custom_html with inline styles for gradients. Do NOT use the built-in HeaderSection.
- Keep logos appropriately sized (max h-12 or h-16, w-auto). NEVER make logos fill the entire page width.
- Use custom_html for most sections. Only use built-in InventoryTable, AcceptanceForm, and TermsSection.
- All custom_html sections must have complete, valid HTML with proper styling.`;

  if (input.tertiaryColor) {
    prompt += `\n**Tertiary Color:** ${input.tertiaryColor}`;
  }
  if (input.logoUrl) {
    prompt += `\n**Logo URL:** ${input.logoUrl}`;
  }

  prompt += `\n\n**User's Description:**\n${input.description}`;

  // Reference file (PDF or image)
  if (input.referenceFileData) {
    prompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 REFERENCE FILE ATTACHED - EXACT REPLICATION REQUIRED 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

I have attached a reference ${input.referenceFileData.mediaType === "application/pdf" ? "PDF document" : "image"} (${input.referenceFileData.filename}) that shows the EXACT layout you need to match.

⚠️ **THIS IS A REPLICATION TASK, NOT A DESIGN TASK.**

**STEP-BY-STEP ANALYSIS REQUIRED:**

1. **Examine the document/image from TOP TO BOTTOM**
2. **Identify and describe each section:**
   - What does the header look like? (colors, gradient direction, logo position)
   - What sections appear below the header? (in exact order)
   - How is each section styled? (colors, borders, spacing, layout)

3. **Extract specific details:**
   - Header colors and gradient (e.g., "red #dc2626 on LEFT to purple #7c3aed on RIGHT")
   - Section order (e.g., "1. Intro paragraph, 2. Location info cards, 3. Quote summary...")
   - Typography (font sizes, weights, alignment)
   - Card/box styling (rounded corners, shadows, borders)
   - Color scheme (exact hex values if visible)

4. **BEFORE generating JSON:** Write a brief description of what you see, section by section. Then recreate it EXACTLY in your JSON output.

**CRITICAL:** The user's text description provides context, but the VISUAL REFERENCE is your PRIMARY source of truth. If there's any conflict, follow the visual reference.`;
  }

  let screenshotData: ReferenceFileData | null = null;
  let urlCaptureError: string | null = null;

  if (input.referenceUrl) {
    // Fetch the actual reference content with browser automation
    const { html: referenceContent, screenshot, error: fetchError } = await fetchReferenceContent(input.referenceUrl);
    
    prompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 REFERENCE LAYOUT PROVIDED - EXACT REPLICATION REQUIRED 🚨
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Reference URL:** ${input.referenceUrl}

⚠️ CRITICAL: This is a REPLICATION task, NOT a design task.
You MUST copy this layout EXACTLY. Any deviation is WRONG.`;

    // If we got a screenshot, prepare it for the AI
    if (screenshot) {
      const base64Screenshot = screenshot.toString("base64");
      screenshotData = {
        data: base64Screenshot,
        mediaType: "image/png",
        filename: "reference-screenshot.png",
      };
      console.log(`[LLM Service] Captured screenshot of reference URL (${(base64Screenshot.length / 1024).toFixed(2)}KB)`);
      
      prompt += `\n\n📸 **SCREENSHOT ATTACHED** - I have captured a full screenshot of the reference layout.

**YOUR TASK:**
1. Look at the screenshot from TOP TO BOTTOM
2. Identify EVERY section and its exact appearance
3. Note EXACT colors (especially header gradients)
4. Replicate the EXACT section order
5. Match EXACT styling (spacing, fonts, borders, shadows)
6. Copy the EXACT layout structure (columns, cards, tables)

**ANALYSIS CHECKLIST:**
□ Header: What colors? Gradient direction? Logo position? Text layout?
□ Sections: List them in order from top to bottom
□ Styling: What colors, fonts, spacing do you see?
□ Layout: Single/multi-column? Cards? Tables?
□ Details: Borders? Shadows? Background colors?

**BEFORE YOU GENERATE:** Describe what you see in the screenshot, section by section, to ensure you understand it correctly. Then replicate EXACTLY what you described.`;
    }

    if (referenceContent) {
      prompt += `\n\n📄 **REFERENCE HTML PROVIDED:**
I have fetched the HTML source code from the reference URL. Use this with the screenshot to understand the EXACT structure:

\`\`\`html
${referenceContent}
\`\`\`

**Extract from this HTML:**
- EXACT color values (hex codes, rgb values)
- EXACT class names and styles
- EXACT section structure and order
- EXACT element hierarchy

**Your goal:** Recreate this EXACTLY in your JSON output. Use custom_html sections to match the custom styling you see.`;
    }

    if (!screenshot && !referenceContent) {
      urlCaptureError = fetchError || "unknown error";
      console.error(`[LLM Service] Cannot fetch reference URL, relying on description. Error: ${urlCaptureError}`);
      prompt += `\n\n⚠️ Note: I was unable to capture the reference URL (${urlCaptureError}). 
      
The URL may require authentication or have CORS restrictions. I will rely ENTIRELY on the user's description to match the layout.

IMPORTANT: Follow the user's description PRECISELY. Pay special attention to:
- Header design (colors, gradient, logo placement)
- Section order (exact sequence)
- Styling details (exact hex colors, spacing, fonts)
- Layout structure (columns, cards, tables)`;
    }
  }

  if (input.referenceFileContent) {
    prompt += `\n\n**Reference Document Content (extracted from PDF):**\n${input.referenceFileContent.substring(0, 5000)}\n\nUse this content to understand the exact layout structure and match it precisely.`;
  }

  const hasVisualReference = screenshotData || input.referenceFileData;
  
  if (hasVisualReference) {
    prompt += `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 FINAL INSTRUCTION - READ CAREFULLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**BEFORE GENERATING JSON, ANALYZE THE REFERENCE:**

Look at the reference screenshot/image/PDF and mentally answer these questions:

1. **Header Analysis:**
   - What color is the header background? (solid color or gradient?)
   - If gradient: what direction? What colors? (e.g., "red #dc2626 LEFT to purple #7c3aed RIGHT")
   - Where is the logo positioned? (left, center, right?)
   - What text appears in the header? What is the layout?
   - Are there any specific design elements? (crown icon, banner, rounded corners?)

2. **Section Inventory (list in order from top to bottom):**
   - Section 1: [what type? heading? paragraph? cards?]
   - Section 2: [what type?]
   - Section 3: [what type?]
   - ... continue for ALL visible sections

3. **Styling Details:**
   - What is the page background color?
   - Are sections in cards/boxes or continuous?
   - What colors are used for section headings?
   - What spacing/padding do you observe?
   - Are there borders, shadows, or other decorative elements?

4. **Specific Features:**
   - How is location information displayed? (two columns? cards?)
   - How is pricing/quote summary shown? (table? cards? list?)
   - What's the overall layout structure? (single column? multi-column?)

**NOW GENERATE JSON BASED ON YOUR ANALYSIS:**

Your JSON MUST recreate what you just analyzed. Every section in your JSON should correspond to a section you saw in the reference. Every color should match. Every layout choice should replicate the reference.

**CRITICAL CHECKLIST BEFORE SUBMITTING:**
□ Header matches reference header EXACTLY
□ Sections are in the SAME ORDER as reference
□ Colors match reference (especially header gradient)
□ Layout structure matches (columns, cards, spacing)
□ Section styling matches (borders, shadows, backgrounds)

Return ONLY valid JSON. NO explanations, NO markdown fences around the JSON.`;
  } else {
    prompt += `\n\nGenerate a complete layout config JSON that follows the description. Return ONLY the JSON.`;
  }

  return { prompt, screenshotData, urlCaptureError };
}
