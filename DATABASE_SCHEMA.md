# Database Schema Documentation

## Overview

This document describes the database schema for the Moveware application. The application uses PostgreSQL as the primary database with Prisma as the ORM.

## Companies Table

### Table: `companies`

Stores company information and branding settings.

**Columns:**

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String (CUID) | PRIMARY KEY | cuid() | Unique company identifier |
| name | String | NOT NULL | - | Company name |
| apiKey | String | UNIQUE, NOT NULL | - | API key for Moveware integration |
| isActive | Boolean | NOT NULL | true | Whether company is active |
| primaryColor | VARCHAR(7) | NOT NULL | '#2563eb' | Primary brand color (hex format) |
| secondaryColor | VARCHAR(7) | NOT NULL | '#1e40af' | Secondary brand color (hex format) |
| tertiaryColor | VARCHAR(7) | NOT NULL | '#60a5fa' | Tertiary brand color (hex format) |
| logoUrl | VARCHAR(500) | NULLABLE | NULL | URL or path to company logo |
| updatedBy | String | NULLABLE | NULL | User ID who last updated settings |
| createdAt | Timestamp | NOT NULL | now() | Record creation timestamp |
| updatedAt | Timestamp | NOT NULL | now() | Record last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `apiKey`
- INDEX on `id` (for lookup performance)

**Relationships:**
- One-to-many with `bot_conversations` (via companyId)

**Default Brand Colors:**
All new companies receive default colors from the design system:
- Primary: `#2563eb` (Blue 600)
- Secondary: `#1e40af` (Blue 800)
- Tertiary: `#60a5fa` (Blue 400)

### Example Query

```typescript
// Get company with branding settings
const company = await prisma.company.findUnique({
  where: { id: companyId },
  select: {
    id: true,
    name: true,
    primaryColor: true,
    secondaryColor: true,
    tertiaryColor: true,
    logoUrl: true,
    updatedBy: true,
  },
});

// Update company settings
await prisma.company.update({
  where: { id: companyId },
  data: {
    primaryColor: '#ff0000',
    secondaryColor: '#00ff00',
    logoUrl: 'https://example.com/logo.png',
    updatedBy: userId,
  },
});
```

## Jobs Table

### Table: `jobs`

Stores job/move information synced from Moveware.

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | String (CUID) | PRIMARY KEY | Unique job identifier |
| movewareJobId | String | UNIQUE, NOT NULL | External Moveware job ID |
| companyId | String | NOT NULL | Reference to company |
| customerId | String | NULLABLE | Customer identifier |
| customerName | String | NULLABLE | Customer name |
| status | String | NOT NULL | Job status |
| scheduledDate | Timestamp | NULLABLE | When job is scheduled |
| completedDate | Timestamp | NULLABLE | When job was completed |
| originAddress | String | NULLABLE | Pick-up address |
| destinationAddress | String | NULLABLE | Drop-off address |
| data | Text | NOT NULL | JSON data from Moveware |
| createdAt | Timestamp | NOT NULL | Record creation timestamp |
| updatedAt | Timestamp | NOT NULL | Record last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `movewareJobId`
- INDEX on `companyId`
- INDEX on `movewareJobId`

## Quotes Table

### Table: `quotes`

Stores customer quotes and acceptance status.

**Columns:**

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id | String (CUID) | PRIMARY KEY | cuid() | Unique quote identifier |
| quoteNumber | String | UNIQUE, NOT NULL | - | Quote number |
| jobId | String | NULLABLE | - | Related job ID |
| companyId | String | NOT NULL | - | Company that created quote |
| customerName | String | NOT NULL | - | Customer name |
| customerEmail | String | NULLABLE | - | Customer email |
| customerPhone | String | NULLABLE | - | Customer phone |
| status | String | NOT NULL | 'pending' | Quote status |
| totalAmount | Float | NOT NULL | - | Total quote amount |
| validUntil | Timestamp | NULLABLE | - | Quote expiration date |
| termsAccepted | Boolean | NOT NULL | false | Whether terms were accepted |
| acceptedAt | Timestamp | NULLABLE | - | When quote was accepted |
| acceptedBy | String | NULLABLE | - | Who accepted the quote |
| signatureData | Text | NULLABLE | - | Digital signature data |
| data | Text | NOT NULL | - | Full quote data as JSON |
| createdAt | Timestamp | NOT NULL | now() | Record creation timestamp |
| updatedAt | Timestamp | NOT NULL | now() | Record last update timestamp |

**Indexes:**
- PRIMARY KEY on `id`
- UNIQUE INDEX on `quoteNumber`
- INDEX on `companyId`
- INDEX on `jobId`
- INDEX on `quoteNumber`

## Additional Tables

For brevity, other tables in the schema include:

- **costings**: Product/service pricing items
- **activities**: Job activities and tasks
- **inventory**: Items being moved
- **hero_settings**: Homepage hero section settings per company
- **branding_settings**: Additional branding settings (legacy, prefer using companies table)
- **copy_settings**: Customizable text content per company
- **review_submissions**: Customer feedback submissions
- **conversations**: Chat conversation threads
- **conversation_messages**: Individual messages in conversations
- **bot_conversations**: AI assistant conversation sessions
- **bot_messages**: AI assistant messages

See `prisma/schema.prisma` for complete details on all tables.

## Migration History

### 2025-01-02: Company Settings Columns

**Migration:** `20250102000000_add_company_settings_columns`

**Changes:**
- Added `primaryColor` column to companies table
- Added `secondaryColor` column to companies table
- Added `tertiaryColor` column to companies table
- Added `logoUrl` column to companies table
- Added `updatedBy` column to companies table
- Added index on `id` for performance

**Rollback:** See `prisma/migrations/20250102000000_add_company_settings_columns/rollback.sql`

## Database Maintenance

### Backup Procedures

```bash
# Full database backup
pg_dump -h localhost -U your_user -d moveware_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific table
pg_dump -h localhost -U your_user -d moveware_db -t companies > companies_backup.sql
```

### Restore Procedures

```bash
# Restore full database
psql -h localhost -U your_user -d moveware_db < backup.sql

# Restore specific table
psql -h localhost -U your_user -d moveware_db < companies_backup.sql
```

## Best Practices

1. **Always use Prisma Client** - Never write raw SQL queries directly
2. **Use transactions** - For multi-step operations that must succeed or fail together
3. **Index foreign keys** - All foreign key columns should have indexes
4. **Validate data** - Use Prisma validators and TypeScript types
5. **Handle errors** - Always wrap database operations in try/catch blocks
6. **Use connection pooling** - Prisma handles this automatically
7. **Backup before migrations** - Always backup production data before schema changes

## Schema Conventions

- **Table Names**: Lowercase with underscores (mapped via `@@map()`)
- **Column Names**: camelCase in Prisma, snake_case in database
- **Primary Keys**: Use CUID strings, not auto-incrementing integers
- **Timestamps**: Always include `createdAt` and `updatedAt`
- **Soft Deletes**: Use `isActive` or `deletedAt` columns instead of hard deletes
- **JSON Data**: Store complex objects in `data` fields as Text with JSON

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/moveware_db?schema=public"
```

See `.env.example` for all required environment variables.
