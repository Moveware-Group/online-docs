/**
 * Placeholder Registry
 *
 * Single source of truth for all template variables available in custom layouts.
 * Used by:
 *   - The template resolver in custom-layout-renderer.tsx
 *   - The placeholder picker UI in the Layout Builder
 *   - Developer documentation
 *
 * Syntax: {{key}} in HTML templates, {{#each array}} ... {{/each}} for loops.
 */

export interface PlaceholderDefinition {
  key: string;
  label: string;
  category: PlaceholderCategory;
  example: string;
  description?: string;
}

export type PlaceholderCategory =
  | 'Customer'
  | 'Job'
  | 'Origin Address'
  | 'Destination Address'
  | 'Pricing'
  | 'Measures'
  | 'Branding'
  | 'Dates'
  | 'Loop Fields';

export const PLACEHOLDER_REGISTRY: PlaceholderDefinition[] = [
  // ── Customer ──────────────────────────────────────────────────────────────
  {
    key: 'customerName',
    label: 'Full Customer Name',
    category: 'Customer',
    example: 'Mr John Smith',
    description: 'Title + first + last name combined',
  },
  {
    key: 'job.titleName',
    label: 'Title',
    category: 'Customer',
    example: 'Mr',
  },
  {
    key: 'job.firstName',
    label: 'First Name',
    category: 'Customer',
    example: 'John',
  },
  {
    key: 'job.lastName',
    label: 'Last Name',
    category: 'Customer',
    example: 'Smith',
  },

  // ── Job ───────────────────────────────────────────────────────────────────
  {
    key: 'moveManager',
    label: 'Move Manager Name',
    category: 'Job',
    example: 'Sarah Johnson',
    description: 'The Moveware staff member managing this job',
  },
  {
    key: 'job.id',
    label: 'Job / Quote Number',
    category: 'Job',
    example: '111505',
  },
  {
    key: 'job.brandCode',
    label: 'Brand Code',
    category: 'Job',
    example: 'MWB',
  },
  {
    key: 'job.branchCode',
    label: 'Branch Code',
    category: 'Job',
    example: 'MEL',
  },
  {
    key: 'job.estimatedDeliveryDetails',
    label: 'Estimated Delivery Details',
    category: 'Job',
    example: '27/02/2026',
  },

  // ── Dates ─────────────────────────────────────────────────────────────────
  {
    key: 'quoteDate',
    label: 'Quote Date',
    category: 'Dates',
    example: '18/02/2026',
    description: 'Today\'s date in DD/MM/YYYY format',
  },
  {
    key: 'expiryDate',
    label: 'Expiry Date',
    category: 'Dates',
    example: '18/03/2026',
    description: '30 days from quote date',
  },

  // ── Origin Address ────────────────────────────────────────────────────────
  {
    key: 'job.upliftLine1',
    label: 'Origin Street Line 1',
    category: 'Origin Address',
    example: '3 Spring Water Crescent',
  },
  {
    key: 'job.upliftLine2',
    label: 'Origin Street Line 2',
    category: 'Origin Address',
    example: '',
  },
  {
    key: 'job.upliftCity',
    label: 'Origin City',
    category: 'Origin Address',
    example: 'Cranbourne',
  },
  {
    key: 'job.upliftState',
    label: 'Origin State',
    category: 'Origin Address',
    example: 'VIC',
  },
  {
    key: 'job.upliftPostcode',
    label: 'Origin Postcode',
    category: 'Origin Address',
    example: '3977',
  },
  {
    key: 'job.upliftCountry',
    label: 'Origin Country',
    category: 'Origin Address',
    example: 'Australia',
  },

  // ── Destination Address ───────────────────────────────────────────────────
  {
    key: 'job.deliveryLine1',
    label: 'Destination Street Line 1',
    category: 'Destination Address',
    example: '12 Cato Street',
  },
  {
    key: 'job.deliveryLine2',
    label: 'Destination Street Line 2',
    category: 'Destination Address',
    example: '',
  },
  {
    key: 'job.deliveryCity',
    label: 'Destination City',
    category: 'Destination Address',
    example: 'Hawthorn East',
  },
  {
    key: 'job.deliveryState',
    label: 'Destination State',
    category: 'Destination Address',
    example: 'VIC',
  },
  {
    key: 'job.deliveryPostcode',
    label: 'Destination Postcode',
    category: 'Destination Address',
    example: '3123',
  },
  {
    key: 'job.deliveryCountry',
    label: 'Destination Country',
    category: 'Destination Address',
    example: 'Australia',
  },

  // ── Pricing ───────────────────────────────────────────────────────────────
  {
    key: 'job.jobValue',
    label: 'Total Job Value',
    category: 'Pricing',
    example: '2675.00',
    description: 'Total value formatted to 2 decimal places',
  },

  // ── Measures ──────────────────────────────────────────────────────────────
  {
    key: 'job.measuresVolumeGrossM3',
    label: 'Gross Volume (m³)',
    category: 'Measures',
    example: '0.62',
  },
  {
    key: 'job.measuresWeightGrossKg',
    label: 'Gross Weight (kg)',
    category: 'Measures',
    example: '70',
  },
  {
    key: 'totalCube',
    label: 'Total Inventory Cube (m³)',
    category: 'Measures',
    example: '12.50',
  },

  // ── Branding ──────────────────────────────────────────────────────────────
  {
    key: 'branding.companyName',
    label: 'Company Name',
    category: 'Branding',
    example: 'Grace Removals',
  },
  {
    key: 'branding.logoUrl',
    label: 'Company Logo URL',
    category: 'Branding',
    example: '/uploads/logo.png',
    description: 'Use as img src',
  },
  {
    key: 'branding.heroBannerUrl',
    label: 'Hero Banner Image URL',
    category: 'Branding',
    example: '/uploads/layouts/banner.jpg',
    description: 'Use as img src for the hero/header banner',
  },
  {
    key: 'branding.footerImageUrl',
    label: 'Footer Image URL',
    category: 'Branding',
    example: '/uploads/layouts/footer.jpg',
    description: 'Use as img src for the footer banner',
  },
  {
    key: 'branding.primaryColor',
    label: 'Primary Color',
    category: 'Branding',
    example: '#cc0000',
    description: 'Use as CSS color value',
  },
  {
    key: 'branding.secondaryColor',
    label: 'Secondary Color',
    category: 'Branding',
    example: '#ffffff',
  },
  {
    key: 'companyName',
    label: 'Company Name (shorthand)',
    category: 'Branding',
    example: 'Grace Removals',
  },
  {
    key: 'primaryColor',
    label: 'Primary Color (shorthand)',
    category: 'Branding',
    example: '#cc0000',
  },

  // ── Loop Fields (for use inside {{#each}} blocks) ─────────────────────────
  {
    key: 'this.description',
    label: 'Item Description',
    category: 'Loop Fields',
    example: 'Full-service domestic move',
    description: 'Use inside {{#each costings}} or {{#each inventory}}',
  },
  {
    key: 'this.name',
    label: 'Costing Name',
    category: 'Loop Fields',
    example: 'Option 1 – Access Fee',
    description: 'Use inside {{#each costings}}',
  },
  {
    key: 'this.quantity',
    label: 'Quantity',
    category: 'Loop Fields',
    example: '1',
    description: 'Use inside {{#each costings}} or {{#each inventory}}',
  },
  {
    key: 'this.rate',
    label: 'Rate',
    category: 'Loop Fields',
    example: '2675.00',
    description: 'Use inside {{#each costings}}',
  },
  {
    key: 'this.totalPrice',
    label: 'Total Price',
    category: 'Loop Fields',
    example: '2675.00',
    description: 'Use inside {{#each costings}}',
  },
  {
    key: 'this.netTotal',
    label: 'Net Total',
    category: 'Loop Fields',
    example: 'N/A',
    description: 'Use inside {{#each costings}}',
  },
  {
    key: 'this.room',
    label: 'Room',
    category: 'Loop Fields',
    example: 'Living Room',
    description: 'Use inside {{#each inventory}}',
  },
  {
    key: 'this.cube',
    label: 'Cube (m³)',
    category: 'Loop Fields',
    example: '0.50',
    description: 'Use inside {{#each inventory}}',
  },
  {
    key: 'this.typeCode',
    label: 'Type Code',
    category: 'Loop Fields',
    example: 'FC',
    description: 'Use inside {{#each inventory}}',
  },
];

/** Convenience: look up a placeholder by its key */
export function getPlaceholder(key: string): PlaceholderDefinition | undefined {
  return PLACEHOLDER_REGISTRY.find((p) => p.key === key);
}

/** Convenience: get all placeholders for a given category */
export function getPlaceholdersByCategory(
  category: PlaceholderCategory,
): PlaceholderDefinition[] {
  return PLACEHOLDER_REGISTRY.filter((p) => p.category === category);
}

/** All unique categories in display order */
export const PLACEHOLDER_CATEGORIES: PlaceholderCategory[] = [
  'Customer',
  'Job',
  'Dates',
  'Origin Address',
  'Destination Address',
  'Pricing',
  'Measures',
  'Branding',
  'Loop Fields',
];
