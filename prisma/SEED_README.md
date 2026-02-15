# Database Seed & Mock Data

This document describes the seed data (for database tables) and mock API data (for the quote page) used during development.

## Database Seed (`prisma/seed.ts`)

Run the seed script to populate the database with sample records.

### What Gets Seeded

| Table | Record | Key Fields |
|---|---|---|
| Company | Crown Worldwide | brandCode: `CROWN`, apiKey: `demo-api-key-crown` |
| BrandingSettings | Crown branding | primaryColor: `#c00000`, font: Inter |
| HeroSettings | Crown hero | title: "Professional Moving Services" |
| CopySettings | Crown copy | welcomeMessage: "Welcome to Crown Worldwide" |
| Quote | Q-2026-001 | customer: John Doe, $2,500.00 |
| ReviewSubmission | review-sample-001 | rating: 5, "Excellent service!" |

### Running the Seed Script

```bash
# Recommended
npm run db:seed

# Or via Prisma CLI
npx prisma db seed

# Or direct execution
npx tsx prisma/seed.ts
```

The seed uses `upsert` operations so it is **safe to run multiple times**.

---

## Mock API Data (Job 111505)

The quote page (`/quote?jobId=111505&coId=12`) fetches from internal API routes that currently serve static mock data. This allows the quote UI to function while the Moveware API integration is in progress.

### Mock Job Record

| Field | Value |
|---|---|
| **Job ID** | 111505 |
| **Customer** | Mr Leigh Morrow |
| **Brand** | MWB (Crown Worldwide) |
| **Branch** | MEL (Melbourne) |
| **Job Value** | $2,675.00 |
| **Delivery Date** | 27/02/2026 |

**Addresses:**

- **Origin**: 3 Spring Water Crescent, Cranbourne VIC 3977, Australia
- **Destination**: 12 Cato Street, Hawthorn East VIC 3123, Australia

**Measurements:**

- **Volume (Gross)**: 0.623 m³
- **Weight (Gross)**: 70 kg

### Mock Inventory (20 items)

| # | Item | Room | Qty | Volume (m³) | Type |
|---|---|---|---|---|---|
| 1 | Bed, King | Master Bedroom | 1 | 2.14 | FUR |
| 2 | Bed, Single | Bedroom 2 | 1 | 0.71 | FUR |
| 3 | Bedside Table | Master Bedroom | 2 | 0.14 | FUR |
| 4 | Bench | Outdoor | 1 | 0.85 | FUR |
| 5 | Bookcase, Large | Study | 1 | 1.14 | FUR |
| 6 | Cabinet | Living Room | 1 | 1.00 | FUR |
| 7 | Carton Bike | Garage | 1 | 0.30 | CTN |
| 8 | Chair, Dining | Dining Room | 4 | 0.14 | FUR |
| 9 | Chair, Kitchen | Kitchen | 2 | 0.14 | FUR |
| 10 | Chest of Drawers | Master Bedroom | 1 | 0.71 | FUR |
| 11 | Childs Bike | Garage | 1 | 0.20 | MISC |
| 12 | Childs Furniture | Bedroom 2 | 1 | 0.15 | FUR |
| 13 | Clothes Horse | Laundry | 1 | 0.12 | MISC |
| 14 | Cubby House Kids | Outdoor | 1 | 1.00 | MISC |
| 15 | Desk Large | Study | 1 | 1.00 | FUR |
| 16 | Dryer | Laundry | 1 | 0.26 | APPL |
| 17 | Dresser | Master Bedroom | 1 | 0.85 | FUR |
| 18 | Dressing Table | Master Bedroom | 1 | 0.70 | FUR |
| 19 | Fishing Rods | Garage | 3 | 0.02 | MISC |
| 20 | Filing Cabinet 2 | Study | 1 | 0.28 | FUR |

### Mock Costing

| Field | Value |
|---|---|
| **Name** | Standard Domestic Move |
| **Total Price** | $2,675.00 (AUD, tax included) |
| **Net Total** | $2,431.82 |

**Inclusions:** Professional packing, packing materials, furniture disassembly/reassembly, loading/unloading, transport, placement, basic transit insurance, floor/doorway protection.

**Exclusions:** Storage, cleaning, appliance disconnection, piano/specialty items, parking permits, additional insurance.

### API Routes (Mock Mode)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/jobs/[jobId]?coId=` | Job details + branding |
| GET | `/api/jobs/[jobId]/inventory?coId=` | Inventory items |
| GET | `/api/jobs/[jobId]/costings?coId=` | Pricing options |
| POST | `/api/jobs/[jobId]/sync?coId=` | Sync placeholder (no-op) |

All routes include `"source": "mock"` in their response so the frontend can distinguish mock data from live API data in the future.

---

## Prerequisites

1. **PostgreSQL** must be running and accessible
2. **DATABASE_URL** must be set in `.env`
3. **Prisma Client** must be generated: `npm run db:generate`
4. **Database tables** must exist: `npm run db:push` or `npm run db:migrate`

## Verifying the Data

### Using Prisma Studio

```bash
npm run db:studio
```

Then navigate to `http://localhost:5555` to browse tables.

### Using the Quote Page

Open the mock quote in your browser:

```
http://localhost:3000/quote?jobId=111505&coId=12
```

## Resetting the Database

```bash
# Reset and re-seed (WARNING: deletes all data)
npx prisma migrate reset

# Or manual reset
npm run db:push --force-reset
npm run db:seed
```

## Related Files

- **Seed Script**: `prisma/seed.ts`
- **Schema**: `prisma/schema.prisma`
- **Mock Job API**: `app/api/jobs/[jobId]/route.ts`
- **Mock Inventory API**: `app/api/jobs/[jobId]/inventory/route.ts`
- **Mock Costings API**: `app/api/jobs/[jobId]/costings/route.ts`
- **Mock Sync API**: `app/api/jobs/[jobId]/sync/route.ts`
- **Quote Page**: `app/quote/page.tsx`
