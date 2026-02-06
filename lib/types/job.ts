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
  id: number;
  titleName?: string;
  firstName?: string;
  lastName?: string;
  estimatedDeliveryDetails?: string;
  jobValue?: number;
  dateModified?: Date;
  brandCode?: string;
  branchCode?: string;
  companyCode?: string;
  
  // Measures
  measuresVolumeGrossF3?: number;
  measuresVolumeGrossM3?: number;
  measuresVolumeNetF3?: number;
  measuresVolumeNetM3?: number;
  measuresWeightGrossKg?: number;
  measuresWeightGrossLb?: number;
  measuresWeightNetKg?: number;
  measuresWeightNetLb?: number;
  
  // Uplift Address
  upliftLine1?: string;
  upliftLine2?: string;
  upliftCity?: string;
  upliftState?: string;
  upliftPostcode?: string;
  upliftCountry?: string;
  
  // Delivery Address
  deliveryLine1?: string;
  deliveryLine2?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryPostcode?: string;
  deliveryCountry?: string;
  
  // Raw data for reference
  rawData?: any;
}

/**
 * Database Inventory Item model (for Prisma)
 */
export interface InventoryItemData {
  id: number;
  jobId: string;
  description?: string;
  room?: string;
  quantity?: number;
  destination?: string;
  cube?: number;
  typeCode?: string;
  barcode?: string;
  rawData?: any;
}

/**
 * Transform Moveware API job to database format
 */
export function transformJobForDatabase(apiJob: MovewareJob): JobData {
  const measures = apiJob.measures?.[0];
  const uplift = apiJob.addresses?.Uplift;
  const delivery = apiJob.addresses?.Delivery;
  
  return {
    id: apiJob.id,
    titleName: apiJob.titleName,
    firstName: apiJob.firstName,
    lastName: apiJob.lastName,
    estimatedDeliveryDetails: apiJob.estimatedDeliveryDetails,
    jobValue: apiJob.jobValue,
    dateModified: apiJob.dateModified ? new Date(apiJob.dateModified) : undefined,
    brandCode: apiJob.brandCode,
    branchCode: apiJob.branchCode,
    companyCode: apiJob.companyCode,
    
    // Measures
    measuresVolumeGrossF3: measures?.volume?.gross?.f3,
    measuresVolumeGrossM3: measures?.volume?.gross?.m3,
    measuresVolumeNetF3: measures?.volume?.net?.f3,
    measuresVolumeNetM3: measures?.volume?.net?.m3,
    measuresWeightGrossKg: measures?.weight?.gross?.kg,
    measuresWeightGrossLb: measures?.weight?.gross?.lb,
    measuresWeightNetKg: measures?.weight?.net?.kg,
    measuresWeightNetLb: measures?.weight?.net?.lb,
    
    // Uplift Address
    upliftLine1: uplift?.line1,
    upliftLine2: uplift?.line2,
    upliftCity: uplift?.city,
    upliftState: uplift?.state,
    upliftPostcode: uplift?.postcode,
    upliftCountry: uplift?.country,
    
    // Delivery Address
    deliveryLine1: delivery?.line1,
    deliveryLine2: delivery?.line2,
    deliveryCity: delivery?.city,
    deliveryState: delivery?.state,
    deliveryPostcode: delivery?.postcode,
    deliveryCountry: delivery?.country,
    
    // Store full raw data for reference
    rawData: apiJob,
  };
}

/**
 * Transform Moveware inventory item to database format
 */
export function transformInventoryItemForDatabase(
  apiItem: MovewareInventoryItem,
  jobId: string
): InventoryItemData {
  return {
    id: apiItem.id,
    jobId: jobId,
    description: apiItem.description,
    room: apiItem.room,
    quantity: apiItem.quantity,
    destination: apiItem.destination,
    cube: apiItem.cube,
    typeCode: apiItem.typeCode,
    barcode: apiItem.barcode,
    rawData: apiItem,
  };
}
