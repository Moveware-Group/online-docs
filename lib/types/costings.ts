/**
 * Costings types for job pricing and estimates
 */

export interface CostingItem {
  id: string;
  category: CostingCategory;
  name: string;
  description: string;
  unitPrice: number;
  unit: string;
  isActive: boolean;
}

export interface CostingCategory {
  id: string;
  name: string;
  description: string;
  sortOrder: number;
}

export interface JobCosting {
  jobId: string;
  items: JobCostingItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobCostingItem {
  costingItemId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface CostingEstimate {
  estimateId: string;
  items: CostingEstimateItem[];
  subtotal: number;
  discount?: number;
  tax: number;
  total: number;
  validUntil: string;
  currency: string;
}

export interface CostingEstimateItem {
  costingItem: CostingItem;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}
