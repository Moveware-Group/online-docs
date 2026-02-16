# AI Layout Builder - Changes Made to Improve Reference Matching

## Date: 2026-02-16

## Problem
The AI Assistant was not matching the reference layouts provided by users. It was creating layouts with different colors, styling, and structure (e.g., gradient headers in different styles) even when given a reference URL.

## Root Cause
The AI cannot actually access or view reference URLs. It was only receiving vague instructions like "inspired by or similar to the design at this URL" which led to creative interpretations rather than exact matching.

## Changes Made

### 1. Updated LLM System Prompt (`lib/services/llm-service.ts`)
**Change:** Added critical instruction at the top of the system prompt
```
⚠️ CRITICAL INSTRUCTION: When a user provides a REFERENCE URL or REFERENCE FILE, 
your PRIMARY GOAL is to MATCH that layout EXACTLY. Do not be creative or add your 
own design touches. Replicate the structure, colors, sections, and styling as 
precisely as possible based on the user's description of the reference.
```

**Impact:** The AI now understands that exact matching is the top priority when references are provided.

### 2. Enhanced Generation Prompt (`lib/services/llm-service.ts`)
**Before:**
```
**Reference URL:** {url}
The user wants the layout to be inspired by or similar to the design at this URL.
```

**After:**
```
⚠️ CRITICAL: The user has provided a reference layout that you MUST match as 
closely as possible. This is not a suggestion or inspiration - you MUST replicate 
the layout structure, sections, and styling from the reference URL.

Pay careful attention to:
- The EXACT order and structure of sections
- Header design and styling (colors, gradients, layout)
- Section arrangement and spacing
- Typography and text alignment
- Color scheme and branding placement
- Any custom HTML sections vs built-in components used
```

**Impact:** The prompt is now much more explicit about exact matching requirements.

### 3. Updated UI Warning Messages (`app/settings/layout-builder/page.tsx`)
**Added:**
- Warning box that appears when a reference URL is entered
- Explains that the AI cannot view the URL
- Lists what details need to be included in the description
- Red asterisk (*) on Description label when reference URL is provided
- Changed placeholder text to guide users on what to include
- Expanded description textarea rows from 3 to 5 when reference URL present

**Impact:** Users now understand they must provide detailed descriptions for the AI to match the layout.

### 4. Created Comprehensive Documentation
**New Files:**
- `docs/AI_LAYOUT_BUILDER_GUIDE.md` - Detailed markdown guide
- `app/docs/ai-layout-guide/page.tsx` - Web-accessible guide page

**Content Includes:**
- Explanation of the AI's limitation (cannot view URLs)
- Step-by-step instructions for matching reference layouts
- Detailed breakdown of what to include in descriptions:
  - Header section details
  - Section order and structure
  - Styling details
  - Color scheme
- Example of a good description vs. poor description
- Tips for success
- Common issues and solutions
- Refining instructions

**Impact:** Users have a complete reference guide for using the feature effectively.

### 5. Added Help Button to UI
**Added:** Help link in the top bar that opens the guide in a new tab

**Impact:** Easy access to documentation while using the Layout Builder.

## How to Use the Updated Feature

### For Staff Using the AI Layout Builder:

1. **Open the reference layout** in your browser first
2. **Enter the reference URL** in the Layout Builder form
3. **Write a DETAILED description** including:
   - Header design: colors, gradients, logo position, content layout
   - Section order: numbered list of all sections in exact order
   - Styling: fonts, colors, borders, shadows, spacing
   - Color scheme: specific hex codes for all colors used
4. **Click "Generate Layout"**
5. **Review the preview** and use chat to refine specific details
6. **Save and activate** when it matches

### Example Good Description (for Grace New Zealand):

```
This is the new quote format for Grace New Zealand. 

HEADER:
- Full-width gradient banner from red (#dc2626) on the left to purple (#7c3aed) on the right
- Crown Worldwide logo on the left side of the header
- "Moving Quote" title in white text, large font
- Quote number displayed below title
- Date and Valid until displayed on the top right in white text
- Customer greeting "Dear Mr Leigh Morrow," in bold below header on white background

SECTIONS (in this exact order):
1. Introduction paragraph with white background
2. Location Information - two-column layout
3. Quote Summary with Estimated Volume, Total Weight, Delivery Date in white cards
4. Service Options & Pricing 
5. Complete Inventory table
6. Acceptance form
7. Terms and conditions

STYLING:
- Clean modern design with rounded corners
- White background
- Light gray borders on cards
- Sans-serif font (Inter)
- Red color (#dc2626) for section headings
- Proper spacing between sections
```

## Testing Recommendations

1. Test with Grace New Zealand reference URL
2. Provide the detailed description as shown above
3. Verify the generated layout matches:
   - Header gradient (red to purple, left to right)
   - Section order matches exactly
   - Colors match (#dc2626 red, #7c3aed purple)
   - Styling matches (rounded corners, white cards, etc.)

4. If not matching:
   - Use the chat to request specific changes
   - Be explicit: "Change header gradient to go from #dc2626 on left to #7c3aed on right"
   - Refine iteratively

## Expected Results

With these changes:
- The AI should now prioritize exact matching over creative design
- Users receive clear guidance on providing detailed descriptions
- The system explicitly tells the AI to MATCH rather than be "inspired by"
- Users understand the AI's limitations and know how to work within them

## Notes

- The fundamental limitation remains: the AI cannot view reference URLs
- Success depends on users providing detailed descriptions
- The more specific the description, the better the results
- Multiple refinement iterations may still be needed for complex layouts
- The Help documentation is now easily accessible for reference
