/**
 * Mock quote data for preview purposes
 * This data is used when rendering layout previews in the layout builder
 */

export interface MockQuoteData {
  job: {
    id: string;
    titleName: string;
    firstName: string;
    lastName: string;
    estimatedDeliveryDetails: string;
    jobValue: number;
    brandCode: string;
    branchCode: string;
    upliftLine1: string;
    upliftLine2: string;
    upliftCity: string;
    upliftState: string;
    upliftPostcode: string;
    upliftCountry: string;
    deliveryLine1: string;
    deliveryLine2: string;
    deliveryCity: string;
    deliveryState: string;
    deliveryPostcode: string;
    deliveryCountry: string;
    measuresVolumeGrossM3: number;
    measuresWeightGrossKg: number;
  };
  branding: {
    companyName: string;
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
  };
  customerName: string;
  quoteDate: string;
  expiryDate: string;
  totalCube: number;
  inventory: Array<{
    description: string;
    room: string;
    quantity: number;
    cube: number;
    typeCode: string;
  }>;
  costings: Array<{
    id: string;
    name: string;
    description: string;
    quantity: number;
    rate: number;
    netTotal: number;
    totalPrice: number;
    taxIncluded: boolean;
    rawData: {
      inclusions: string[];
      exclusions: string[];
    };
  }>;
}

export const mockQuoteData: MockQuoteData = {
  job: {
    id: "111505",
    titleName: "Mr",
    firstName: "Leigh",
    lastName: "Morrow",
    estimatedDeliveryDetails: "27/02/2026",
    jobValue: 2675.0,
    brandCode: "gracenz",
    branchCode: "AKL",
    upliftLine1: "3 Spring Water Crescent",
    upliftLine2: "",
    upliftCity: "Cranbourne",
    upliftState: "VIC",
    upliftPostcode: "3977",
    upliftCountry: "Australia",
    deliveryLine1: "12 Cato Street",
    deliveryLine2: "",
    deliveryCity: "Hawthorn East",
    deliveryState: "VIC",
    deliveryPostcode: "3123",
    deliveryCountry: "Australia",
    measuresVolumeGrossM3: 11.85,
    measuresWeightGrossKg: 70,
  },
  branding: {
    companyName: "Crown Worldwide Group",
    logoUrl: "/api/uploads/logos/crown-logo.png",
    primaryColor: "#dc2626",
    secondaryColor: "#7c3aed",
  },
  customerName: "Mr Leigh Morrow",
  quoteDate: "18/02/2026",
  expiryDate: "18/03/2026",
  totalCube: 11.85,
  inventory: [
    {
      description: "Bed, King",
      room: "Master Bedroom",
      quantity: 1,
      cube: 2.14,
      typeCode: "FUR",
    },
    {
      description: "Bed, Single",
      room: "Bedroom 2",
      quantity: 1,
      cube: 0.71,
      typeCode: "FUR",
    },
    {
      description: "Bedside Table",
      room: "Master Bedroom",
      quantity: 2,
      cube: 0.14,
      typeCode: "FUR",
    },
    {
      description: "Bench",
      room: "Outdoor",
      quantity: 1,
      cube: 0.85,
      typeCode: "FUR",
    },
    {
      description: "Bookcase, Large",
      room: "Study",
      quantity: 1,
      cube: 1.14,
      typeCode: "FUR",
    },
    {
      description: "Cabinet",
      room: "Living Room",
      quantity: 1,
      cube: 1.0,
      typeCode: "FUR",
    },
    {
      description: "Carton Bike",
      room: "Garage",
      quantity: 1,
      cube: 0.3,
      typeCode: "CTN",
    },
    {
      description: "Chair, Dining",
      room: "Dining Room",
      quantity: 4,
      cube: 0.14,
      typeCode: "FUR",
    },
    {
      description: "Chair, Kitchen",
      room: "Kitchen",
      quantity: 2,
      cube: 0.14,
      typeCode: "FUR",
    },
    {
      description: "Chest of Drawers",
      room: "Bedroom 2",
      quantity: 1,
      cube: 0.71,
      typeCode: "FUR",
    },
    {
      description: "Coffee Table",
      room: "Living Room",
      quantity: 1,
      cube: 0.42,
      typeCode: "FUR",
    },
    {
      description: "Desk",
      room: "Study",
      quantity: 1,
      cube: 0.85,
      typeCode: "FUR",
    },
    {
      description: "Dining Table",
      room: "Dining Room",
      quantity: 1,
      cube: 1.42,
      typeCode: "FUR",
    },
    {
      description: "Fridge/Freezer",
      room: "Kitchen",
      quantity: 1,
      cube: 1.7,
      typeCode: "APP",
    },
    {
      description: "Microwave",
      room: "Kitchen",
      quantity: 1,
      cube: 0.14,
      typeCode: "APP",
    },
  ],
  costings: [
    {
      id: "MOVE001",
      name: "Standard Domestic Move",
      description:
        "Full-service domestic move from Cranbourne to Hawthorn East. Includes professional packing, loading, transport, unloading, and placement at your new home.",
      quantity: 1,
      rate: 2675.0,
      netTotal: 2436.36,
      totalPrice: 2675.0,
      taxIncluded: true,
      rawData: {
        inclusions: [
          "Professional packing materials",
          "Furniture disassembly and reassembly",
          "Loading and unloading",
          "Transport via modern removal truck",
          "Basic transit insurance",
        ],
        exclusions: [
          "Packing of personal items (clothing, books, etc.)",
          "Piano moving (separate quote required)",
          "Storage fees",
          "Additional insurance beyond basic coverage",
        ],
      },
    },
  ],
};

/**
 * Get mock quote data (allows for future customization per company/brand)
 */
export function getMockQuoteData(companyId?: string, brandCode?: string): MockQuoteData {
  // For now, return the same mock data
  // In the future, you could customize per company or brand
  return mockQuoteData;
}
