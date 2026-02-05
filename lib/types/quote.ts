// Quote-related type definitions

export interface Address {
  street: string;
  city: string;
  state: string;
  postcode: string;
  country?: string;
}

export interface Contact {
  name: string;
  email: string;
  phone: string;
}

export interface JobDetails {
  id: string;
  quoteNumber: string;
  status: 'draft' | 'pending' | 'approved' | 'declined';
  customer: Contact;
  moveDate: string;
  origin: Address;
  destination: Address;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  volume: number; // in cubic meters
  weight?: number; // in kg
  description?: string;
  fragile?: boolean;
}

export interface CostItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CostBreakdown {
  items: CostItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
}

export interface QuoteData {
  jobDetails: JobDetails;
  inventory: InventoryItem[];
  costings: CostBreakdown;
}

export interface QuoteResponse {
  success: boolean;
  data?: QuoteData;
  error?: string;
}
