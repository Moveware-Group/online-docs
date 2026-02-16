# Layout Preview System Documentation

## Overview

The AI Layout Builder now includes a **proper quote preview system** that renders layouts with realistic mock data instead of showing raw template placeholders like `{{this}}` or `{{#if condition}}`.

## Problem Solved

### Before
- ❌ Preview showed raw Handlebars template code
- ❌ Displayed `{{#if this.rawData.inclusions}}` instead of actual data
- ❌ No way to see how the layout would actually look
- ❌ Difficult to validate layout design

### After
- ✅ Preview shows actual rendered quote with mock data
- ✅ Template variables properly processed and replaced
- ✅ Realistic quote data (customer name, address, pricing, inventory)
- ✅ Live preview updates as AI generates layouts

## Architecture

### 1. Mock Data (`lib/data/mock-quote-data.ts`)

Provides realistic quote data for preview:

```typescript
{
  job: {
    id: "111505",
    firstName: "Leigh",
    lastName: "Morrow",
    upliftCity: "Cranbourne",
    deliveryCity: "Hawthorn East",
    // ... full address and job details
  },
  branding: {
    companyName: "Crown Worldwide Group",
    primaryColor: "#dc2626",
    secondaryColor: "#7c3aed",
  },
  inventory: [
    { description: "Bed, King", room: "Master Bedroom", quantity: 1, cube: 2.14 },
    // ... 15 items total
  ],
  costings: [
    {
      name: "Standard Domestic Move",
      totalPrice: 2675.00,
      inclusions: ["Professional packing", "Loading/unloading", ...],
      exclusions: ["Piano moving", "Storage fees", ...],
    }
  ]
}
```

### 2. Layout Renderer (`lib/components/layout/layout-renderer.tsx`)

Processes templates and renders layouts:

**Supported Template Syntax:**
- `{{variable}}` - Simple variable replacement
- `{{object.property}}` - Nested property access
- `{{#if condition}}...{{/if}}` - Conditional rendering
- `{{#each array}}...{{/each}}` - Array iteration
- `{{this}}` - Current context in loops

**Example Template:**
```html
<h1>{{customerName}}</h1>
<p>From: {{job.upliftCity}} to {{job.deliveryCity}}</p>

{{#if costings}}
  {{#each costings}}
    <div class="pricing">
      <h3>{{this.name}}</h3>
      <p>${{this.totalPrice}}</p>
      
      {{#if this.rawData.inclusions}}
        <ul>
          {{#each this.rawData.inclusions}}
            <li>{{this}}</li>
          {{/each}}
        </ul>
      {{/if}}
    </div>
  {{/each}}
{{/if}}
```

**Rendered Output:**
```html
<h1>Mr Leigh Morrow</h1>
<p>From: Cranbourne to Hawthorn East</p>

<div class="pricing">
  <h3>Standard Domestic Move</h3>
  <p>$2675.00</p>
  
  <ul>
    <li>Professional packing materials</li>
    <li>Furniture disassembly and reassembly</li>
    <li>Loading and unloading</li>
    <li>Transport via modern removal truck</li>
    <li>Basic transit insurance</li>
  </ul>
</div>
```

### 3. Quote Preview Page (`app/quote/page.tsx`)

The iframe preview page that:
1. Receives layout config via `postMessage` from layout builder
2. Loads mock quote data
3. Passes both to the `LayoutRenderer`
4. Displays the fully rendered quote

**Communication Flow:**
```
Layout Builder → postMessage → Quote Preview Page
   (parent)                       (iframe)
      |                               |
      |-- LAYOUT_PREVIEW_UPDATE -->   |
      |   { config: {...} }            |
      |                               |
      |                          Render with
      |                          mock data
      |                               |
      |<-- Display Rendered Layout ---|
```

## How It Works

### When AI Generates a Layout

1. **AI generates JSON config** with custom HTML sections
2. **Layout builder receives config** and updates state
3. **`updatePreview()` called** → sends config to iframe
4. **Quote preview page receives message** via `postMessage`
5. **Layout renderer processes templates** with mock data
6. **User sees fully rendered quote** with real-looking data

### Template Processing

The renderer walks through each section:

```typescript
// For each section with custom HTML
if (section.type === "custom_html" && section.html) {
  // 1. Process {{#each}} loops
  // 2. Process {{#if}} conditionals  
  // 3. Replace {{variables}} with data
  // 4. Inject custom CSS
  // 5. Render final HTML
}
```

### Data Context

Template variables have access to the full mock data structure:

- `{{job.*}}` - Job details (addresses, dates, etc.)
- `{{branding.*}}` - Company branding (colors, logo)
- `{{customerName}}` - Formatted customer name
- `{{quoteDate}}`, `{{expiryDate}}` - Dates
- `{{totalCube}}` - Total volume
- `{{inventory}}` - Array of items (use with `{{#each}}`)
- `{{costings}}` - Array of pricing options (use with `{{#each}}`)

## Mock Data Customization

### Current Approach

Mock data is static and defined in `mock-quote-data.ts`:
- 15 inventory items (furniture, appliances)
- 1 costing option (Standard Domestic Move)
- Realistic addresses (Cranbourne → Hawthorn East)
- $2,675 quote value

### Future Enhancements

You can customize mock data per company/brand:

```typescript
export function getMockQuoteData(
  companyId?: string,
  brandCode?: string
): MockQuoteData {
  // Customize based on company
  if (brandCode === "gracenz") {
    return {
      ...mockQuoteData,
      branding: {
        companyName: "Grace New Zealand",
        primaryColor: "#dc2626",
        secondaryColor: "#7c3aed",
      },
    };
  }
  
  return mockQuoteData;
}
```

## Usage in Layout Builder

### Staff Workflow

1. **Select Company** → Grace New Zealand
2. **Provide Reference** → URL or PDF upload
3. **Add Description** → Brief layout requirements
4. **Click "Generate Layout"**
5. **AI creates layout** with custom HTML sections
6. **Preview updates automatically** → Shows real-looking quote
7. **Refine via chat** → "Make header gradient go left to right"
8. **Preview updates again** → See changes instantly
9. **Approve & Save** when satisfied

### Preview Refresh

The preview auto-updates when:
- ✅ Initial layout generated
- ✅ Layout refined via chat
- ✅ Manual refresh button clicked

## Template Best Practices

### Do's ✅

**Use proper nesting:**
```html
{{#if costings}}
  {{#each costings}}
    <h3>{{this.name}}</h3>
  {{/each}}
{{/if}}
```

**Access nested properties:**
```html
{{job.upliftCity}}
{{branding.primaryColor}}
{{this.rawData.inclusions}}
```

**Check arrays before iterating:**
```html
{{#if inventory}}
  {{#each inventory}}
    <li>{{this.description}}</li>
  {{/each}}
{{/if}}
```

### Don'ts ❌

**Don't use undefined variables:**
```html
<!-- Bad: undefined variable -->
{{unknownVariable}}

<!-- Good: with fallback -->
{{#if job.notes}}{{job.notes}}{{/if}}
```

**Don't nest {{#each}} without context:**
```html
<!-- Bad: loses context -->
{{#each costings}}
  {{#each inventory}}
    {{this.name}} <!-- Which 'this'? -->
  {{/each}}
{{/each}}
```

**Don't assume array exists:**
```html
<!-- Bad: might error -->
{{#each inventory}}...{{/each}}

<!-- Good: check first -->
{{#if inventory}}{{#each inventory}}...{{/each}}{{/if}}
```

## Extending the System

### Add New Data Fields

**1. Update mock data:**
```typescript
// In mock-quote-data.ts
export const mockQuoteData: MockQuoteData = {
  // ... existing fields
  moveDate: "15/03/2026",
  specialInstructions: "Fragile items - handle with care",
};
```

**2. Use in templates:**
```html
<p>Move Date: {{moveDate}}</p>
<div class="notes">{{specialInstructions}}</div>
```

### Add Built-in Components

**1. Define component interface:**
```typescript
// In layout renderer
const builtInComponents = {
  HeaderSection: () => <Header data={data} />,
  PricingCard: () => <PricingCard costings={data.costings} />,
};
```

**2. Render in layout:**
```typescript
if (section.type === "built_in" && section.component) {
  const Component = builtInComponents[section.component];
  return <Component />;
}
```

### Connect to Real Data

To use real quote data instead of mock data:

**1. Update quote page to fetch real data:**
```typescript
// In app/quote/page.tsx
const [data, setData] = useState<QuoteData | null>(null);

useEffect(() => {
  async function fetchQuoteData() {
    const res = await fetch(`/api/quotes/${jobId}`);
    const realData = await res.json();
    setData(realData);
  }
  fetchQuoteData();
}, [jobId]);
```

**2. Pass to renderer:**
```typescript
<LayoutRenderer config={layoutConfig} data={data} />
```

## Troubleshooting

### Preview shows blank/white page

**Cause:** Layout config not received or invalid

**Solution:**
1. Check browser console for errors
2. Verify `postMessage` is working
3. Check layout config JSON is valid
4. Try clicking "Refresh Preview" button

### Template variables not replaced

**Cause:** Variable name doesn't match mock data structure

**Solution:**
1. Check variable path in template (e.g., `{{job.firstName}}`)
2. Verify field exists in `mock-quote-data.ts`
3. Use browser devtools to inspect data structure

### {{#each}} loop shows nothing

**Cause:** Array is empty or doesn't exist

**Solution:**
1. Check array exists: `{{#if arrayName}}{{#each arrayName}}...`
2. Verify array in mock data has items
3. Check console for errors

### CSS not applying

**Cause:** CSS scoping or syntax issue

**Solution:**
1. Use Tailwind classes where possible
2. Check custom CSS in `section.css`
3. Verify CSS doesn't conflict with global styles
4. Use browser devtools to inspect styles

## Performance Considerations

### Template Rendering

- Templates are processed on every render
- Uses `useMemo` to cache rendered HTML
- Only re-processes when config or data changes

### Preview Updates

- Uses `postMessage` for parent-iframe communication
- Debounced to avoid excessive updates
- Lightweight JSON transmission

### Mock Data Size

- Current mock data: ~15 inventory items
- Typical size: ~5KB JSON
- No impact on performance

## Security

### Template Injection

The renderer uses `dangerouslySetInnerHTML` for custom HTML:

**Mitigations:**
- ✅ Only staff can create layouts (authenticated)
- ✅ Templates generated by AI, not user input
- ✅ Preview isolated in iframe
- ✅ No script execution in preview context

**Best Practice:**
- Don't allow users to directly input HTML
- AI should sanitize generated HTML
- Keep preview in sandboxed iframe

### XSS Protection

- Mock data is static (no user input)
- Real implementation should sanitize data
- Use CSP headers in production

## Future Improvements

### Enhanced Mock Data

- [ ] Multiple quote scenarios (small move, large move, international)
- [ ] Different company brandings per company
- [ ] Randomized data for variety
- [ ] Import from real quote API

### Better Template Engine

- [ ] Use proper Handlebars library
- [ ] Support more helpers (formatDate, formatCurrency)
- [ ] Custom helpers for business logic
- [ ] Template validation

### Real-time Collaboration

- [ ] Multiple users can preview same layout
- [ ] Share preview URL
- [ ] Version history
- [ ] Comments on preview

### Mobile Preview

- [ ] Responsive preview toggle
- [ ] Mobile/tablet/desktop views
- [ ] Test on different screen sizes

## Summary

The mock data and layout renderer system provides a **professional preview experience** for the AI Layout Builder:

✅ **Real-looking quotes** with proper data  
✅ **Template processing** for dynamic content  
✅ **Instant updates** as layouts are generated  
✅ **Easy to customize** for different companies  
✅ **Ready for production** with real data integration  

No more confusing template placeholders - staff can now see exactly how the quote will look to customers!
