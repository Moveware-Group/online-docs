# Moveware Online Quote System

Modern web application for displaying moving quotes, built with Next.js 14, TypeScript, Tailwind CSS, and PostgreSQL. Automatically syncs data from Moveware API.

## Features

- 🚀 **Auto-Sync**: Automatically fetches job and inventory data from Moveware API on first access
- 💾 **Local Caching**: Stores data in PostgreSQL for fast subsequent loading
- 🔄 **Manual Refresh**: Force sync latest data with one click
- 🎨 **Modern UI**: Beautiful, responsive quote documents with Inter font
- 🏢 **Multi-Tenant**: Supports multiple brands with custom branding
- 📊 **Dynamic Data**: All content loaded from database, not hardcoded

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/moveware_db

# Moveware API
MOVEWARE_API_URL=https://api.moveware.com
MOVEWARE_USERNAME=your_username
MOVEWARE_PASSWORD=your_password
MOVEWARE_COMPANY_ID=your_company_id
```

5. Set up the database:
```bash
npm run db:migrate
```

6. (Optional) Seed with sample data:
```bash
npm run db:seed
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Accessing Quotes

Visit a quote by job ID:
```
http://localhost:3000/jobs/111505
```

**First access**: System automatically fetches data from Moveware API and saves to database  
**Subsequent access**: Data loads instantly from local database

### Build for Production

```bash
npm run build
npm start
```

## How It Works

### Data Flow

1. **User visits** `/jobs/[jobId]`
2. **System checks** PostgreSQL database for job data
3. **If not found**: Fetches from Moveware API, transforms, and saves to database
4. **If found**: Loads directly from database (fast!)
5. **Displays** beautiful quote document

See [DATA_SYNC.md](./DATA_SYNC.md) for detailed documentation.

## Project Structure

```
├── app/                              # Next.js app router
│   ├── api/                         # API routes
│   │   ├── jobs/[jobId]/           # Job endpoints
│   │   │   ├── route.ts            # GET job (auto-sync)
│   │   │   ├── inventory/route.ts  # GET inventory (auto-sync)
│   │   │   └── sync/route.ts       # POST force sync
│   │   └── settings/               # Settings endpoints
│   ├── jobs/[jobId]/               # Dynamic quote pages
│   │   └── page.tsx                # Quote document UI
│   ├── layout.tsx                  # Root layout
│   └── globals.css                 # Global styles
├── lib/                             # Core library
│   ├── clients/                    # API clients
│   │   └── moveware.ts             # Moveware API client
│   ├── services/                   # Business logic
│   │   ├── jobService.ts           # Job CRUD operations
│   │   └── inventoryService.ts     # Inventory operations
│   ├── types/                      # TypeScript types
│   │   ├── job.ts                  # Job & inventory types
│   │   └── moveware.ts             # Moveware API types
│   └── components/                 # Reusable components
├── prisma/                          # Database
│   ├── schema.prisma               # Database schema
│   └── seed.ts                     # Sample data seeder
├── DATA_SYNC.md                    # Data sync documentation
├── DATABASE_SCHEMA.md              # Database documentation
└── POSTGRES_SETUP.md               # PostgreSQL setup guide
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:push      # Push schema changes (dev)
npm run db:studio    # Open Prisma Studio (DB GUI)
```

## Key Features Explained

### 🔄 Automatic Data Sync

No manual database seeding required! Just visit a quote page:

```
http://localhost:3000/jobs/111505
```

The system will:
- Check if job exists in database
- Fetch from Moveware API if not found
- Transform and save the data
- Display the quote

### 🎨 Dynamic Branding

Each brand can have custom:
- Company logo
- Primary/secondary colors
- Font family

Configured in the `Branding` table, linked to jobs via `brandCode`.

### 📊 Multi-Tenant Support

Multiple moving companies on one platform:
- Each brand has unique `brandCode`
- Jobs linked to brands
- Separate branding per company

### ⚡ Performance

- **First load**: ~2-3 seconds (API fetch + save)
- **Cached load**: <100ms (database only)
- Refresh button for manual sync

## API Endpoints

### Jobs

- `GET /api/jobs/[jobId]` - Get job (auto-sync from Moveware if needed)
- `POST /api/jobs/[jobId]/sync` - Force refresh from Moveware API

### Inventory

- `GET /api/jobs/[jobId]/inventory` - Get inventory (auto-sync if needed)

### Settings

- `GET/PUT /api/settings/branding` - Manage branding
- `GET/PUT /api/settings/hero` - Hero image settings
- `GET/PUT /api/settings/copy` - Copy/content settings

## Environment Variables

### Required

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Moveware API
MOVEWARE_API_URL=https://api.moveware.com
MOVEWARE_USERNAME=your_username
MOVEWARE_PASSWORD=your_password
MOVEWARE_COMPANY_ID=your_company_id
```

### Optional

```env
# API Version (if needed)
MOVEWARE_API_VERSION=v1

# App Configuration
NEXT_PUBLIC_APP_NAME=Moveware Quotes
NEXT_PUBLIC_APP_URL=https://quotes.moveware.com
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS
- **Font**: Inter (Google Fonts)
- **API**: Moveware REST API

## Documentation

- [DATA_SYNC.md](./DATA_SYNC.md) - How data synchronization works
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Database structure and relationships
- [POSTGRES_SETUP.md](./POSTGRES_SETUP.md) - PostgreSQL installation guide

## Troubleshooting

### "Job not found" error

1. Check Moveware API credentials in `.env`
2. Verify job exists in Moveware: `curl https://api.moveware.com/jobs/111505`
3. Check server logs for API errors
4. Try manual sync: `curl -X POST http://localhost:3000/api/jobs/111505/sync`

### Database connection issues

1. Ensure PostgreSQL is running
2. Check `DATABASE_URL` in `.env`
3. Run migrations: `npm run db:migrate`
4. Test connection: `npm run db:studio`

### Stale data showing

Click the "Refresh" button on the quote page, or call:
```bash
curl -X POST http://localhost:3000/api/jobs/111505/sync
```

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## License

Proprietary - All rights reserved
