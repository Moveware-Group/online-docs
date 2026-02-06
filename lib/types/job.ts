/**
 * Type definitions for Job and Inventory management
 */

/**
 * Job from Moveware API
 */
export interface MovewareJob {
  id: number;
  titleName?: string;
  firstName?: string;
  lastName?: string;
  estimatedDeliveryDetails?: string;
  jobValue?: number;
  dateModified?: string;
  brandCode?: string;
  branchCode?: string;
  companyCode?: string;
  addresses?: {
    Uplift?: MovewareAddress;
    Delivery?: MovewareAddress;
  };
  measures?: Array<{
    volume?: {
      gross?: {
        f3?: number;
        m3?: number;
      };
      net?: {
        f3?: number;
        m3?: number;
      };
    };
    weight?: {
      gross?: {
        kg?: number;
        lb?: number;
      };
      net?: {
        kg?: number;
        lb?: number;
      };
    };
  }>;
  [key: string]: any; // Allow additional fields
}

export interface MovewareAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

/**
 * Inventory item from Moveware API
 */
export interface MovewareInventoryItem {
  id: number;
  description?: string;
  room?: string;
  quantity?: number;
  destination?: string;
  cube?: number;
  typeCode?: string;
  barcode?: string;
  parentid?: number; // jobId
  [key: string]: any; // Allow additional fields
}

/**
 * Inventory response from API
 */
export interface MovewareInventoryResponse {
  inventoryUsage: MovewareInventoryItem[];
}

/**
 * Database Job model (for Prisma)
 */
export interface JobData {
  id: string;
  movewareJobId: string;
  companyId: string;
  customerId?: string;
  customerName?: string;
  status: string;
  scheduledDate?: Date;
  completedDate?: Date;
  originAddress?: string;
  destinationAddress?: string;
  data: string; // JSON string of full Moveware API response
}

/**
 * Database Inventory Item model (for Prisma)
 */
export interface InventoryItemData {
  id: string;
  jobId: string;
  companyId: string;
  movewareId?: string;
  itemName: string;
  category?: string;
  quantity?: number;
  volume?: number;
  weight?: number;
  fragile?: boolean;
  notes?: string;
  room?: string;
  data?: string;
}

/**
 * Transform Moveware API job to database format
 */
export function transformJobForDatabase(apiJob: MovewareJob): JobData {
  const uplift = apiJob.addresses?.Uplift;
  const delivery = apiJob.addresses?.Delivery;
  
  // Build address strings
  const originAddress = uplift 
    ? [uplift.line1, uplift.line2, uplift.city, uplift.state, uplift.postcode].filter(Boolean).join(', ')
    : undefined;
    
  const destinationAddress = delivery
    ? [delivery.line1, delivery.line2, delivery.city, delivery.state, delivery.postcode].filter(Boolean).join(', ')
    : undefined;
  
  // Build customer name from available fields
  const customerName = [apiJob.titleName, apiJob.firstName, apiJob.lastName]
    .filter(Boolean)
    .join(' ') || undefined;
  
  return {
    id: String(apiJob.id),
    movewareJobId: String(apiJob.id),
    companyId: apiJob.companyCode || apiJob.brandCode || 'unknown',
    customerId: apiJob.customerId,
    customerName,
    status: apiJob.status || 'active',
    scheduledDate: apiJob.scheduledDate ? new Date(apiJob.scheduledDate) : undefined,
    completedDate: apiJob.completedDate ? new Date(apiJob.completedDate) : undefined,
    originAddress,
    destinationAddress,
    data: JSON.stringify(apiJob),
  };
}

/**
 * Transform Moveware inventory item to database format
 */
export function transformInventoryItemForDatabase(
  apiItem: MovewareInventoryItem,
  jobId: string,
  companyId: string
): InventoryItemData {
  return {
    id: String(apiItem.id),
    jobId: jobId,
    companyId: companyId,
    movewareId: String(apiItem.id),
    itemName: apiItem.description || 'Unnamed Item',
    category: apiItem.typeCode,
    quantity: apiItem.quantity || 1,
    volume: apiItem.cube,
    weight: undefined,
    fragile: false,
    notes: apiItem.barcode ? `Barcode: ${apiItem.barcode}` : undefined,
    room: apiItem.room,
    data: JSON.stringify(apiItem),
  };
}
