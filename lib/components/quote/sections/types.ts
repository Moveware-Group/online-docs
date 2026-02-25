/**
 * Shared types for quote page section components.
 * Used by both the base layout and the CustomLayoutRenderer.
 */

export interface Job {
  id: number;
  titleName?: string;
  firstName?: string;
  lastName?: string;
  moveManager?: string;
  moveType?: string;
  estimatedDeliveryDetails?: string;
  jobValue?: number;
  brandCode?: string;
  branchCode?: string;
  upliftLine1?: string;
  upliftLine2?: string;
  upliftCity?: string;
  upliftState?: string;
  upliftPostcode?: string;
  upliftCountry?: string;
  deliveryLine1?: string;
  deliveryLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostcode?: string;
  deliveryCountry?: string;
  measuresVolumeGrossM3?: number;
  measuresWeightGrossKg?: number;
  branding?: {
    companyName?: string;
    logoUrl?: string;
    heroBannerUrl?: string;
    footerImageUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
  };
}

export interface InventoryItem {
  id: number;
  description?: string;
  room?: string;
  quantity?: number;
  cube?: number;
  typeCode?: string;
  /** Gross weight of a single unit in kilograms */
  weightKg?: number;
}

/** A single charge line item within a pricing option. */
export interface CostingCharge {
  id: number;
  /** Display heading for this line item (charges[].description) */
  heading: string;
  /** Detail text / notes for this line item (charges[].notes) */
  notes: string;
  quantity: number;
  /** Pre-tax price (charges[].rateExclusive) */
  price: number;
  currency: string;
  currencySymbol: string;
  taxCode: string;
  /** Sort key used to order line items (charges[].sort, e.g. "001") */
  sort: string;
  /** Whether this charge is included in the package price */
  included: boolean;
  /**
   * True when this is the aggregate "total" line for the option
   * (charges[].oneTotal === "Y").  This charge is shown as the primary
   * service row; all other charges are shown as optional add-ons.
   */
  isBaseCharge: boolean;
}

export interface CostingItem {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  /** Option-level notes / description text */
  notes?: string;
  quantity?: number;
  rate?: number;
  netTotal?: string;
  totalPrice?: number;
  taxIncluded?: boolean;
  /** ISO currency code (e.g. "AUD") derived from the first charge */
  currency?: string;
  /** Currency symbol (e.g. "$") derived from the first charge */
  currencySymbol?: string;
  /** Structured charge line items from the new quotations endpoint */
  charges?: CostingCharge[];
  rawData?: {
    inclusions?: string[];
    exclusions?: string[];
  };
}

export interface QuotePageData {
  job: Job;
  inventory: InventoryItem[];
  costings: CostingItem[];
  customerName: string;
  companyName: string;
  logoUrl?: string;
  heroBannerUrl?: string;
  footerImageUrl?: string;
  primaryColor: string;
  /** DD/MM/YYYY  */
  quoteDate: string;
  /** Wednesday, February 18, 2026 */
  quoteDateLong: string;
  /** Wednesday, 18 February 2026  */
  quoteDateFull: string;
  /** 18 Feb 2026                  */
  quoteDateMedium: string;
  /** DD/MM/YYYY  */
  expiryDate: string;
  /** Saturday, March 18, 2026     */
  expiryDateLong: string;
  /** Saturday, 18 March 2026      */
  expiryDateFull: string;
  /** 18 Mar 2026                  */
  expiryDateMedium: string;
  totalCube: number;
  /** Unit used to display inventory weights ('kg' | 'lbs'). Defaults to 'kg'. */
  inventoryWeightUnit?: 'kg' | 'lbs';
  /** Pagination metadata for the inventory table (used by custom layout blocks) */
  inventoryFrom?: number;
  inventoryTo?: number;
  inventoryTotal?: number;
  inventoryCurrentPage?: number;
  inventoryTotalPages?: number;
}

export interface SectionConfig {
  [key: string]: unknown;
}
