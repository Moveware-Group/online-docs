# Database Migration Guide

## Company Settings Migration (20250102000000)

This guide covers the migration that adds company branding and customization columns to the companies table.

### Migration Overview

**Migration Name:** `20250102000000_add_company_settings_columns`

**Changes:**
- Adds `primaryColor` (VARCHAR(7), default: '#2563eb')
- Adds `secondaryColor` (VARCHAR(7), default: '#1e40af')
- Adds `tertiaryColor` (VARCHAR(7), default: '#60a5fa')
- Adds `logoUrl` (VARCHAR(500), nullable)
- Adds `updatedBy` (TEXT, nullable)
- Adds index on `id` column for performance

### Running the Migration

#### Development Environment

```bash
# Generate Prisma Client with new schema
npm run db:generate

# Create and apply migration
npm run db:migrate

# If migration already exists, push schema changes
npm run db:push
```

#### Production Environment

```bash
# 1. Backup the database first!
pg_dump -h localhost -U your_user -d moveware_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration
npx prisma migrate deploy

# 3. Verify migration status
npx prisma migrate status
```

### Rollback Procedures

#### Option 1: Using Rollback SQL (Recommended for Production)

```bash
# 1. Backup current database state
pg_dump -h localhost -U your_user -d moveware_db > backup_before_rollback_$(date +%Y%m%d_%H%M%S).sql

# 2. Connect to database
psql -h localhost -U your_user -d moveware_db

# 3. Run rollback script
\i prisma/migrations/20250102000000_add_company_settings_columns/rollback.sql

# 4. Verify columns are removed
\d companies

# 5. Exit psql
\q

# 6. Reset Prisma schema to previous version
git checkout HEAD~1 prisma/schema.prisma

# 7. Regenerate Prisma Client
npm run db:generate
```

#### Option 2: Using Prisma Migrate (Development Only)

⚠️ **Warning:** This method is only safe in development environments.

```bash
# 1. Reset database (deletes all data!)
npx prisma migrate reset

# 2. Restore from backup if needed
psql -h localhost -U your_user -d moveware_db < backup.sql
```

#### Option 3: Manual Rollback via SQL

```sql
-- Connect to your database and run:
BEGIN;

-- Remove the columns
ALTER TABLE "companies" DROP COLUMN IF EXISTS "updatedBy";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "logoUrl";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "tertiaryColor";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "secondaryColor";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "primaryColor";

-- Drop index if created
DROP INDEX IF EXISTS "companies_id_idx";

COMMIT;
```

### Verification Steps

#### After Migration

```bash
# 1. Check migration status
npx prisma migrate status

# 2. Verify schema in database
psql -h localhost -U your_user -d moveware_db -c "\d companies"

# 3. Test default values
psql -h localhost -U your_user -d moveware_db -c "SELECT id, name, \"primaryColor\", \"secondaryColor\", \"tertiaryColor\" FROM companies LIMIT 5;"

# 4. Open Prisma Studio to inspect data
npm run db:studio
```

#### After Rollback

```bash
# 1. Verify columns are removed
psql -h localhost -U your_user -d moveware_db -c "\d companies"

# 2. Check for any errors in application
npm run build

# 3. Verify Prisma Client is regenerated
cat node_modules/.prisma/client/index.d.ts | grep -A 5 "model Company"
```

### Default Values

All new companies will automatically receive these default values:

- **Primary Color:** `#2563eb` (Blue 600 from design system)
- **Secondary Color:** `#1e40af` (Blue 800 from design system)
- **Tertiary Color:** `#60a5fa` (Blue 400 from design system)
- **Logo URL:** `NULL` (no logo by default)
- **Updated By:** `NULL` (set when user updates settings)

### Data Migration for Existing Companies

Existing companies will receive default values automatically during migration. No manual data update is required.

If you need to customize colors for existing companies:

```sql
-- Update specific company
UPDATE "companies"
SET 
  "primaryColor" = '#custom1',
  "secondaryColor" = '#custom2',
  "tertiaryColor" = '#custom3',
  "logoUrl" = 'https://example.com/logo.png',
  "updatedBy" = 'admin_user_id'
WHERE id = 'company_id_here';
```

### Troubleshooting

#### Migration Fails with "column already exists"

```bash
# Check current schema
psql -h localhost -U your_user -d moveware_db -c "\d companies"

# If columns exist, mark migration as applied
npx prisma migrate resolve --applied 20250102000000_add_company_settings_columns
```

#### Prisma Client Out of Sync

```bash
# Regenerate Prisma Client
npm run db:generate

# Rebuild application
npm run build
```

#### Database Connection Issues

```bash
# Test database connection
psql -h localhost -U your_user -d moveware_db -c "SELECT version();"

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### Best Practices

1. **Always backup before migrations** - Create a database dump before applying any schema changes
2. **Test in development first** - Run migrations in a development environment before production
3. **Use transactions** - Wrap manual SQL operations in BEGIN/COMMIT blocks
4. **Verify after rollback** - Always test the application after rolling back a migration
5. **Document custom changes** - If you modify migration files, document why in this guide
6. **Monitor application logs** - Check for errors related to missing columns after deployment

### Support

For issues or questions about this migration:
1. Check application logs for detailed error messages
2. Verify Prisma version matches project requirements
3. Consult Prisma documentation: https://www.prisma.io/docs/concepts/components/prisma-migrate
