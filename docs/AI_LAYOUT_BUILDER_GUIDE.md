# AI Layout Builder Guide

## Overview

The AI Layout Builder allows you to create custom quote page layouts for specific clients using AI assistance. This guide explains how to use it effectively, especially when matching an existing reference layout.

## Important Limitation

⚠️ **CRITICAL**: The AI cannot access or view reference URLs. It relies entirely on your written description to understand what the layout should look like. When you provide a reference URL, you **must** also provide a very detailed description.

## How to Match a Reference Layout

When you want the AI to replicate an existing quote layout:

### 1. Open the reference URL in your browser

View the layout you want to match so you can describe it accurately.

### 2. Enter the reference URL in the form

This stores the URL for documentation purposes and tells the AI you want to match an existing layout.

### 3. Write a DETAILED description

This is the most important step. Your description should include:

#### Header Section
- Logo placement (left, center, right)
- Background color or gradient (e.g., "red #dc2626 on left transitioning to purple #7c3aed on right")
- Header content (quote number, dates, customer name)
- Text colors and alignment

#### Section Order & Structure
List each section in order, e.g.:
1. Header with logo and gradient
2. Location Information (origin and destination)
3. Quote Summary (volume, weight, delivery date)
4. Service Options & Pricing
5. Complete Inventory table
6. Acceptance form
7. Terms and conditions

#### Styling Details
- Font families used
- Background colors (e.g., "white background", "light gray #f9fafb")
- Card/section styling (borders, shadows, padding)
- Button colors and styles
- Table styling

#### Color Scheme
- Primary color and where it's used
- Secondary color and where it's used
- Accent colors
- Text colors (headings, body text, labels)

### Example: Good Description

Here's an example of a detailed description for Grace New Zealand's layout:

```
This is the new quote format for Grace New Zealand. The order is the main difference, as is the header banner layout.

HEADER:
- Full-width gradient banner from red (#dc2626) on the left to purple (#7c3aed) on the right
- Crown Worldwide logo on the left side of the header
- "Moving Quote" title in white text, large font
- Quote number (#11505) displayed below title
- Date and Valid until displayed on the top right of the header in white text
- Customer greeting "Dear Mr Leigh Morrow," in bold below the header on white background

SECTIONS (in this exact order):
1. Introduction paragraph with white background
2. Location Information - two-column layout showing Origin and Destination addresses
3. Quote Summary section with:
   - Estimated Volume (with superscript m³)
   - Total Weight (in kg)
   - Delivery Date
   All in white cards with light borders
4. Service Options & Pricing section showing the move package with price on the right
5. Complete Inventory table with pagination, showing item, quantity, volume, and type columns
6. Acceptance form with signature fields
7. Terms and conditions at the bottom

STYLING:
- Clean, modern design with rounded corners on cards
- White background for the page
- Light gray borders on cards
- Sans-serif font (Inter or similar)
- Red color (#dc2626) used for section headings and labels
- Proper spacing between sections
```

### Example: Poor Description (Don't do this)

❌ "Create a quote layout similar to the reference URL with a nice header and the standard sections."

This is too vague. The AI needs specific details about colors, layout, and section order.

## Tips for Success

1. **Be specific about colors**: Use hex codes or specific color names
2. **Describe the exact section order**: List sections in the order they appear
3. **Mention gradients explicitly**: If there's a gradient, describe the start and end colors
4. **Note any unique styling**: Rounded corners, shadows, borders, etc.
5. **Describe the header in detail**: This is usually the most customized part
6. **Include font information**: If you can identify the font family

## Refining the Layout

After the initial generation:

1. Review the preview carefully
2. Use the AI Chat to request specific changes, e.g.:
   - "The header gradient should go from left to right, not top to bottom"
   - "Move the Quote Summary section above the Service Options"
   - "Make the header banner darker red, use #dc2626"
   - "Add more spacing between sections"

3. Be specific in your refinement requests
4. You can regenerate multiple times until it matches

## Common Issues

### Issue: AI creates a different color scheme
**Solution**: Provide exact hex codes in your description, e.g., "Use #dc2626 for red, #7c3aed for purple"

### Issue: Sections are in the wrong order
**Solution**: List sections with numbers in your description: "1. Header, 2. Location Info, 3. Quote Summary..."

### Issue: Header doesn't match
**Solution**: Describe the header in great detail, including layout, colors, logo position, and content placement

### Issue: Styling is too different
**Solution**: Mention specific CSS properties like "rounded-lg corners", "no shadows", "1px light gray borders"

## Saving and Activating

Once the layout matches your requirements:

1. Click "Approve & Save" in the top right
2. The layout will be activated for all future quotes for this company
3. Test by generating a quote for the company

## Need Help?

If you're having trouble getting the AI to match a layout after 3-4 attempts:

1. Take screenshots of the reference layout
2. Use even more detailed descriptions
3. Refine iteratively through the chat
4. Consider breaking down your changes into smaller, specific requests

Remember: The AI is powerful but needs detailed instructions. The more specific your description, the better the result!
