/**
 * Prisma Seed Script
 * Populates database with sample job and inventory data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create/Update Branding for "MWB" brand (Crown Worldwide)
  console.log('Creating branding for MWB...');
  const branding = await prisma.branding.upsert({
    where: { brandCode: 'MWB' },
    update: {
      logoUrl: '/images/crown_logo.svg',
      primaryColor: '#c00',
      secondaryColor: '#fff',
      tertiaryColor: '#5a5a5a',
    },
    create: {
      companyId: 'crown-worldwide',
      brandCode: 'MWB',
      companyName: 'Crown Worldwide',
      logoUrl: '/images/crown_logo.svg',
      primaryColor: '#c00',
      secondaryColor: '#fff',
      tertiaryColor: '#5a5a5a',
      fontFamily: 'Inter',
    },
  });
  console.log('✓ Created branding:', branding.brandCode);

  // 2. Create Job #111505
  console.log('Creating job #111505...');
  const job = await prisma.job.upsert({
    where: { id: 111505 },
    update: {},
    create: {
      id: 111505,
      titleName: 'Mr',
      firstName: 'Leigh',
      lastName: 'Morrow',
      estimatedDeliveryDetails: '27/02/26',
      jobValue: 2675.0,
      dateModified: new Date('2026-02-05T09:35:48.734Z'),
      brandCode: 'MWB',
      branchCode: 'MEL',
      companyCode: '01',
      
      // Measures from API
      measuresVolumeGrossF3: 22.0,
      measuresVolumeGrossM3: 0.622965,
      measuresVolumeNetF3: 22.0,
      measuresVolumeNetM3: 0.622965,
      measuresWeightGrossKg: 70.0,
      measuresWeightGrossLb: 154.0,
      measuresWeightNetKg: 70.0,
      measuresWeightNetLb: 154.0,
      
      // Uplift Address
      upliftLine1: '3 Spring Water Crescent',
      upliftLine2: '',
      upliftCity: 'Cranbourne',
      upliftState: 'VIC',
      upliftPostcode: '3977',
      upliftCountry: 'Australia',
      
      // Delivery Address
      deliveryLine1: '12 Cato Street',
      deliveryLine2: '',
      deliveryCity: 'Hawthorn East',
      deliveryState: 'VIC',
      deliveryPostcode: '3123',
      deliveryCountry: 'Australia',
      
      rawData: {
        fullname: 'Mr Leigh Morrow',
        method: 'Road',
        status: 'P',
        type: 'LR',
      },
    },
  });
  console.log('✓ Created job:', job.id);

  // 3. Create Inventory Items
  console.log('Creating inventory items...');
  
  const inventoryItems = [
    {
      id: 22302,
      description: 'Bed, King',
      cube: 2.14,
      typeCode: 'Furniture',
      barcode: 'Bed, King',
      quantity: 1,
    },
    {
      id: 22303,
      description: 'Bed, Single',
      cube: 0.71,
      typeCode: 'Furniture',
      barcode: 'Bed, Single',
      quantity: 1,
    },
    {
      id: 22304,
      description: 'Bedside Table',
      cube: 0.14,
      typeCode: 'Furniture',
      barcode: 'Bedside Table',
      quantity: 1,
    },
    {
      id: 22305,
      description: 'Bench',
      cube: 0.85,
      typeCode: 'Furniture',
      barcode: 'Bench',
      quantity: 1,
    },
    {
      id: 22306,
      description: 'Bookcase, Large',
      cube: 1.14,
      typeCode: 'Furniture',
      barcode: 'Bookcase, Large',
      quantity: 1,
    },
    {
      id: 22307,
      description: 'Cabinet',
      cube: 1.0,
      typeCode: 'Furniture',
      barcode: 'Cabinet',
      quantity: 1,
    },
    {
      id: 22308,
      description: 'Carton Bike',
      cube: 0.3,
      typeCode: 'Furniture',
      barcode: 'Carton Bike',
      quantity: 1,
    },
    {
      id: 22309,
      description: 'Chair, Dining',
      cube: 0.14,
      typeCode: 'Furniture',
      barcode: 'Chair, Dining',
      quantity: 1,
    },
    {
      id: 22310,
      description: 'Chair, Kitchen',
      cube: 0.14,
      typeCode: 'Furniture',
      barcode: 'Chair, Kitchen',
      quantity: 1,
    },
    {
      id: 22311,
      description: 'Chest of Drawers',
      cube: 0.71,
      typeCode: 'Furniture',
      barcode: 'Chest of Drawers',
      quantity: 1,
    },
    {
      id: 22312,
      description: 'Childs Bike',
      cube: 0.2,
      typeCode: 'Furniture',
      barcode: 'Childs Bike',
      quantity: 1,
    },
    {
      id: 22313,
      description: 'Childs Furniture',
      cube: 0.15,
      typeCode: 'Furniture',
      barcode: 'Childs Furniture',
      quantity: 1,
    },
    {
      id: 22314,
      description: 'Clothes Horse',
      cube: 0.12,
      typeCode: 'Furniture',
      barcode: 'Clothes Horse',
      quantity: 1,
    },
    {
      id: 22315,
      description: 'Cubby House Kids',
      cube: 1.0,
      typeCode: 'Furniture',
      barcode: 'Cubby House Kids',
      quantity: 1,
    },
    {
      id: 22316,
      description: 'Desk Large',
      cube: 1.0,
      typeCode: 'Furniture',
      barcode: 'Desk Large',
      quantity: 1,
    },
    {
      id: 22317,
      description: 'Dryer',
      cube: 0.26,
      typeCode: 'Furniture',
      barcode: 'Dryer',
      quantity: 1,
    },
    {
      id: 22318,
      description: 'Dresser',
      cube: 0.85,
      typeCode: 'Furniture',
      barcode: 'Dresser',
      quantity: 1,
    },
    {
      id: 22319,
      description: 'Dressing Table',
      cube: 0.7,
      typeCode: 'Furniture',
      barcode: 'Dressing Table',
      quantity: 1,
    },
    {
      id: 22320,
      description: 'Fishing Rods',
      cube: 0.02,
      typeCode: 'Furniture',
      barcode: 'Fishing Rods',
      quantity: 1,
    },
    {
      id: 22321,
      description: 'Filing Cabinet 2',
      cube: 0.28,
      typeCode: 'Furniture',
      barcode: 'Filing Cabinet 2',
      quantity: 1,
    },
  ];

  let inventoryCount = 0;
  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { id: item.id },
      update: {},
      create: {
        id: item.id,
        jobId: 111505,
        description: item.description,
        room: '',
        quantity: item.quantity,
        destination: '',
        cube: item.cube,
        typeCode: item.typeCode,
        barcode: item.barcode,
        rawData: item,
      },
    });
    inventoryCount++;
  }
  console.log(`✓ Created ${inventoryCount} inventory items`);

  // 4. Create Costing Item
  console.log('Creating costing item for job #111505...');
  await prisma.costingItem.upsert({
    where: { id: 'costing-111505-local' },
    update: {},
    create: {
      id: 'costing-111505-local',
      jobId: 111505,
      name: 'Local Removal',
      category: 'Moving Service',
      description: 'Local Moving service with collection from 3 Spring Water Crescent, Cranbourne and delivering to Hawthorn East.',
      quantity: 1,
      rate: 300.00,
      netTotal: 'N/A',
      totalPrice: 300.00,
      taxIncluded: true,
      rawData: {
        inclusions: [
          'Protection of floors, hallways & lifts where applicable',
          'Full packing service, including all boxes and materials',
          'Dismantling of non flat-packed goods',
          'Delivery into destination address, positioning & setting up of goods one time into relevant rooms',
        ],
        exclusions: [
          'Disconnection and/or reconnection to mains supply (water electricity)',
          'Unexpected difficult access, use of outside lifting machine, long carry over 30 metres',
          'Parking charges (optional)',
          'Removals and storage insurance cover (see below)',
          'Unpacking services (optional)',
          'Reassembly of items not dismantled by us (optional)',
          'Any other additional/optional services',
        ],
      },
    },
  });
  console.log('✓ Created costing item');

  // 5. Summary
  console.log('\n📊 Seed Summary:');
  console.log('- Branding: 1 (MWB - Crown Worldwide)');
  console.log('- Jobs: 1 (Job #111505)');
  console.log(`- Inventory Items: ${inventoryCount}`);
  console.log('- Costing Items: 1');
  console.log('\n✅ Database seeded successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
