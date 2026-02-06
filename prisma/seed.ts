/**
 * Prisma Seed Script
 * Populates database with sample job and inventory data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Company and BrandingSettings for Crown Worldwide
  console.log('Creating company and branding...');
  const company = await prisma.company.upsert({
    where: { apiKey: 'crown-worldwide-api-key' },
    update: {
      name: 'Crown Worldwide',
    },
    create: {
      name: 'Crown Worldwide',
      apiKey: 'crown-worldwide-api-key',
      isActive: true,
    },
  });

  const branding = await prisma.brandingSettings.upsert({
    where: { companyId: company.id },
    update: {
      logoUrl: '/images/crown_logo.svg',
      primaryColor: '#c00',
      secondaryColor: '#fff',
    },
    create: {
      companyId: company.id,
      logoUrl: '/images/crown_logo.svg',
      primaryColor: '#c00',
      secondaryColor: '#fff',
      fontFamily: 'Inter',
    },
  });
  console.log('✓ Created company and branding:', company.name);

  // 2. Create Job #111505
  console.log('Creating job #111505...');
  const job = await prisma.job.upsert({
    where: { movewareJobId: '111505' },
    update: {},
    create: {
      movewareJobId: '111505',
      companyId: company.id,
      customerId: 'CUST001',
      customerName: 'Mr Leigh Morrow',
      status: 'P',
      scheduledDate: new Date('2026-02-27'),
      originAddress: '3 Spring Water Crescent, Cranbourne, VIC, 3977, Australia',
      destinationAddress: '12 Cato Street, Hawthorn East, VIC, 3123, Australia',
      data: JSON.stringify({
        fullname: 'Mr Leigh Morrow',
        method: 'Road',
        status: 'P',
        type: 'LR',
        jobValue: 2675.0,
      }),
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
    await prisma.inventory.upsert({
      where: { id: String(item.id) },
      update: {},
      create: {
        id: String(item.id),
        jobId: job.id,
        companyId: company.id,
        movewareId: String(item.id),
        itemName: item.description,
        category: item.typeCode,
        quantity: item.quantity,
        volume: item.cube,
        fragile: false,
        notes: `Barcode: ${item.barcode}`,
        room: '',
        data: JSON.stringify(item),
      },
    });
    inventoryCount++;
  }
  console.log(`✓ Created ${inventoryCount} inventory items`);

  // 4. Create Costing Item
  console.log('Creating costing item...');
  await prisma.costing.upsert({
    where: { id: 'costing-111505-local' },
    update: {},
    create: {
      id: 'costing-111505-local',
      companyId: company.id,
      name: 'Local Removal',
      category: 'Moving Service',
      description: 'Local Moving service with collection from 3 Spring Water Crescent, Cranbourne and delivering to Hawthorn East.',
      unitPrice: 300.00,
      unit: 'service',
      isActive: true,
      data: JSON.stringify({
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
      }),
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
