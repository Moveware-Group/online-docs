/**
 * Costings Service
 * Provides stubbed costings data until live endpoint is available
 */

import { CostingItem, CostingCategory, JobCosting } from '../types/costings';

// Stubbed categories data
const STUBBED_CATEGORIES: CostingCategory[] = [
  {
    id: 'cat-packing',
    name: 'Packing Materials',
    description: 'Boxes, tape, and other packing supplies',
    sortOrder: 1,
  },
  {
    id: 'cat-labor',
    name: 'Labor',
    description: 'Moving crew and labor costs',
    sortOrder: 2,
  },
  {
    id: 'cat-transport',
    name: 'Transportation',
    description: 'Vehicle and fuel costs',
    sortOrder: 3,
  },
  {
    id: 'cat-insurance',
    name: 'Insurance',
    description: 'Coverage and protection options',
    sortOrder: 4,
  },
  {
    id: 'cat-storage',
    name: 'Storage',
    description: 'Short and long-term storage solutions',
    sortOrder: 5,
  },
];

// Stubbed costing items data
const STUBBED_ITEMS: CostingItem[] = [
  // Packing Materials
  {
    id: 'item-box-small',
    category: STUBBED_CATEGORIES[0],
    name: 'Small Box',
    description: '1.5 cubic feet packing box',
    unitPrice: 2.5,
    unit: 'each',
    isActive: true,
  },
  {
    id: 'item-box-medium',
    category: STUBBED_CATEGORIES[0],
    name: 'Medium Box',
    description: '3 cubic feet packing box',
    unitPrice: 3.5,
    unit: 'each',
    isActive: true,
  },
  {
    id: 'item-box-large',
    category: STUBBED_CATEGORIES[0],
    name: 'Large Box',
    description: '4.5 cubic feet packing box',
    unitPrice: 4.5,
    unit: 'each',
    isActive: true,
  },
  {
    id: 'item-tape',
    category: STUBBED_CATEGORIES[0],
    name: 'Packing Tape',
    description: 'Heavy-duty packing tape roll',
    unitPrice: 5.0,
    unit: 'roll',
    isActive: true,
  },
  {
    id: 'item-bubble-wrap',
    category: STUBBED_CATEGORIES[0],
    name: 'Bubble Wrap',
    description: 'Protective bubble wrap',
    unitPrice: 15.0,
    unit: 'roll',
    isActive: true,
  },
  // Labor
  {
    id: 'item-mover',
    category: STUBBED_CATEGORIES[1],
    name: 'Professional Mover',
    description: 'Experienced moving professional',
    unitPrice: 45.0,
    unit: 'hour',
    isActive: true,
  },
  {
    id: 'item-lead-mover',
    category: STUBBED_CATEGORIES[1],
    name: 'Lead Mover',
    description: 'Team lead and supervisor',
    unitPrice: 55.0,
    unit: 'hour',
    isActive: true,
  },
  {
    id: 'item-packing-service',
    category: STUBBED_CATEGORIES[1],
    name: 'Professional Packing',
    description: 'Full packing service',
    unitPrice: 50.0,
    unit: 'hour',
    isActive: true,
  },
  // Transportation
  {
    id: 'item-truck-small',
    category: STUBBED_CATEGORIES[2],
    name: 'Small Truck',
    description: '14-foot moving truck',
    unitPrice: 75.0,
    unit: 'hour',
    isActive: true,
  },
  {
    id: 'item-truck-medium',
    category: STUBBED_CATEGORIES[2],
    name: 'Medium Truck',
    description: '20-foot moving truck',
    unitPrice: 95.0,
    unit: 'hour',
    isActive: true,
  },
  {
    id: 'item-truck-large',
    category: STUBBED_CATEGORIES[2],
    name: 'Large Truck',
    description: '26-foot moving truck',
    unitPrice: 125.0,
    unit: 'hour',
    isActive: true,
  },
  {
    id: 'item-fuel-surcharge',
    category: STUBBED_CATEGORIES[2],
    name: 'Fuel Surcharge',
    description: 'Variable fuel cost adjustment',
    unitPrice: 25.0,
    unit: 'trip',
    isActive: true,
  },
  // Insurance
  {
    id: 'item-insurance-basic',
    category: STUBBED_CATEGORIES[3],
    name: 'Basic Coverage',
    description: 'Standard liability coverage',
    unitPrice: 50.0,
    unit: 'job',
    isActive: true,
  },
  {
    id: 'item-insurance-premium',
    category: STUBBED_CATEGORIES[3],
    name: 'Premium Coverage',
    description: 'Full replacement value coverage',
    unitPrice: 150.0,
    unit: 'job',
    isActive: true,
  },
  // Storage
  {
    id: 'item-storage-temp',
    category: STUBBED_CATEGORIES[4],
    name: 'Temporary Storage',
    description: 'Up to 30 days storage',
    unitPrice: 100.0,
    unit: 'month',
    isActive: true,
  },
  {
    id: 'item-storage-long',
    category: STUBBED_CATEGORIES[4],
    name: 'Long-term Storage',
    description: 'Monthly storage rate',
    unitPrice: 85.0,
    unit: 'month',
    isActive: true,
  },
];

/**
 * Get all costing categories
 */
export async function getCategories(): Promise<CostingCategory[]> {
  return Promise.resolve([...STUBBED_CATEGORIES]);
}

/**
 * Get a category by ID
 */
export async function getCategoryById(id: string): Promise<CostingCategory | null> {
  const category = STUBBED_CATEGORIES.find((cat) => cat.id === id);
  return Promise.resolve(category || null);
}

/**
 * Get all costing items
 */
export async function getItems(): Promise<CostingItem[]> {
  return Promise.resolve([...STUBBED_ITEMS]);
}

/**
 * Get costing items by category
 */
export async function getItemsByCategory(categoryId: string): Promise<CostingItem[]> {
  const items = STUBBED_ITEMS.filter((item) => item.category.id === categoryId);
  return Promise.resolve(items);
}

/**
 * Get a costing item by ID
 */
export async function getItemById(id: string): Promise<CostingItem | null> {
  const item = STUBBED_ITEMS.find((item) => item.id === id);
  return Promise.resolve(item || null);
}

/**
 * Get active costing items only
 */
export async function getActiveItems(): Promise<CostingItem[]> {
  const items = STUBBED_ITEMS.filter((item) => item.isActive);
  return Promise.resolve(items);
}

/**
 * Get job costing by job ID
 * Returns stubbed data for demonstration
 */
export async function getJobCosting(jobId: string): Promise<JobCosting | null> {
  // Return stubbed job costing data
  const stubbedCosting: JobCosting = {
    jobId,
    items: [
      {
        costingItemId: 'item-box-medium',
        quantity: 20,
        unitPrice: 3.5,
        totalPrice: 70.0,
        notes: 'Medium boxes for general items',
      },
      {
        costingItemId: 'item-mover',
        quantity: 8,
        unitPrice: 45.0,
        totalPrice: 360.0,
        notes: '2 movers for 4 hours',
      },
      {
        costingItemId: 'item-truck-medium',
        quantity: 4,
        unitPrice: 95.0,
        totalPrice: 380.0,
        notes: 'Medium truck rental',
      },
      {
        costingItemId: 'item-insurance-basic',
        quantity: 1,
        unitPrice: 50.0,
        totalPrice: 50.0,
      },
    ],
    subtotal: 860.0,
    tax: 68.8,
    total: 928.8,
    currency: 'USD',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return Promise.resolve(stubbedCosting);
}

/**
 * Calculate costing total from items
 */
export function calculateTotal(
  items: { quantity: number; unitPrice: number }[],
  taxRate: number = 0.08
): { subtotal: number; tax: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}
