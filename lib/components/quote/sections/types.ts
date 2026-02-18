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
}

export interface CostingItem {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  quantity?: number;
  rate?: number;
  netTotal?: string;
  totalPrice?: number;
  taxIncluded?: boolean;
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
