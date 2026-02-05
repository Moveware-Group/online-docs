# Database Seed Script

This seed script populates your database with sample data from the Moveware API.

## What Gets Seeded

### 1. Branding Record
- **Brand Code**: MWB (Crown Worldwide)
- **Company Name**: Crown Worldwide
- **Colors**: Primary (#1E40AF), Secondary (#3B82F6)
- **Font**: Inter

### 2. Job Record
- **Job ID**: 111505
- **Customer**: Mr Leigh Morrow
- **Brand**: MWB (Crown Worldwide)
- **Branch**: MEL (Melbourne)
- **Job Value**: $2,675.00
- **Delivery Date**: 27/02/26

**Addresses:**
- **Uplift**: 3 Spring Water Crescent, Cranbourne VIC 3977, Australia
- **Delivery**: 12 Cato Street, Hawthorn East VIC 3123, Australia

**Measurements:**
- **Volume (Gross)**: 22.0 f³ / 0.622965 m³
- **Weight (Gross)**: 70 kg / 154 lb

### 3. Inventory Items (20 items)
1. Bed, King (2.14 m³)
2. Bed, Single (0.71 m³)
3. Bedside Table (0.14 m³)
4. Bench (0.85 m³)
5. Bookcase, Large (1.14 m³)
6. Cabinet (1.0 m³)
7. Carton Bike (0.3 m³)
8. Chair, Dining (0.14 m³)
9. Chair, Kitchen (0.14 m³)
10. Chest of Drawers (0.71 m³)
11. Childs Bike (0.2 m³)
12. Childs Furniture (0.15 m³)
13. Clothes Horse (0.12 m³)
14. Cubby House Kids (1.0 m³)
15. Desk Large (1.0 m³)
16. Dryer (0.26 m³)
17. Dresser (0.85 m³)
18. Dressing Table (0.7 m³)
19. Fishing Rods (0.02 m³)
20. Filing Cabinet 2 (0.28 m³)

## Prerequisites

1. **PostgreSQL must be running** and accessible
2. **DATABASE_URL must be set** in your `.env` file
3. **Prisma Client must be generated**: `npm run db:generate`
4. **Database tables must exist**: `npm run db:push` or `npm run db:migrate`

## Running the Seed Script

### Method 1: Using npm script (Recommended)
```bash
npm run db:seed
```

### Method 2: Using Prisma CLI
```bash
npx prisma db seed
```

### Method 3: Direct execution
```bash
npx tsx prisma/seed.ts
```

## Expected Output

```
🌱 Starting database seed...
Creating branding for MWB...
✓ Created branding: MWB
Creating job #111505...
✓ Created job: 111505
Creating inventory items...
✓ Created 20 inventory items

📊 Seed Summary:
- Branding: 1 (MWB - Crown Worldwide)
- Jobs: 1 (Job #111505)
- Inventory Items: 20

✅ Database seeded successfully!
```

## Verifying the Data

### Using Prisma Studio
```bash
npm run db:studio
```
Then navigate to `http://localhost:5555` to view the data.

### Using SQL Query
```bash
# Connect to PostgreSQL
psql -U moveware_user -d moveware_online_docs -h localhost

# Query the data
SELECT * FROM "Job" WHERE id = 111505;
SELECT * FROM "InventoryItem" WHERE "jobId" = 111505;
SELECT * FROM "Branding" WHERE "brandCode" = 'MWB';
```

### Using the API
```bash
# Get job details
curl http://localhost:3000/api/jobs/111505

# Get inventory
curl http://localhost:3000/api/jobs/111505/inventory
```

## Re-running the Seed Script

The seed script uses `upsert` operations, so it's **safe to run multiple times**:
- If records exist, they will be **updated** (not duplicated)
- If records don't exist, they will be **created**

This means you can re-run the seed to reset the data to the original sample values.

## Resetting the Database

To completely reset and re-seed:

```bash
# Option 1: Reset with Prisma (WARNING: Deletes all data!)
npx prisma migrate reset

# Option 2: Manual reset
npm run db:push --force-reset
npm run db:seed
```

## Customizing the Seed Data

To add more sample data, edit `prisma/seed.ts`:

```typescript
// Add more jobs
const anotherJob = await prisma.job.create({
  data: {
    id: 111506,
    firstName: 'Jane',
    lastName: 'Smith',
    // ... more fields
  },
});

// Add more inventory items
const moreItems = await prisma.inventoryItem.createMany({
  data: [
    { id: 22322, jobId: 111506, description: 'Sofa', quantity: 1 },
    // ... more items
  ],
});
```

## Troubleshooting

### Error: "Can't reach database server"
- **Solution**: Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in `.env` file

### Error: "Environment variable not found: DATABASE_URL"
- **Solution**: Create `.env` file with DATABASE_URL:
  ```
  DATABASE_URL="postgresql://moveware_user:password@localhost:5432/moveware_online_docs"
  ```

### Error: "Table does not exist"
- **Solution**: Run migrations first: `npm run db:push` or `npm run db:migrate`

### Error: "Foreign key constraint failed"
- **Solution**: The branding record must exist first. The seed script creates it automatically.

### Error: "tsx not found"
- **Solution**: Install dependencies: `npm install`

## Production Considerations

For production environments:
1. **Don't run seed on production** unless intentional
2. Use separate seed files for different environments
3. Consider using migration scripts instead of seeds for initial data
4. Store sensitive data separately (not in seed files)

## Related Files

- **Seed Script**: `prisma/seed.ts`
- **Schema**: `prisma/schema.prisma`
- **Services**: `lib/services/jobService.ts`, `lib/services/inventoryService.ts`
- **Types**: `lib/types/job.ts`
