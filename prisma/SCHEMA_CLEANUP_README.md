# Database Schema Cleanup

This document explains the database schema cleanup performed to focus on the core quote system functionality.

## What Changed

### ✅ Tables KEPT:

1. **Company** - Stores company information
2. **BrandingSettings** - Company branding (logo, colors, fonts)
3. **HeroSettings** - Custom hero section layout for online quotes
4. **CopySettings** - Custom copy/content for online quotes
5. **Quote** - Quote data for customers
6. **ReviewSubmission** - Customer review/feedback data
7. **BotConversation** - AI Assistant chat conversations

### ❌ Tables REMOVED:

1. **Job** - Job/move tracking (not needed for quote system)
2. **Costing** - Costing items
3. **Activity** - Job activities
4. **Inventory** - Inventory items
5. **PerformanceMetric** - Performance tracking
6. **PerformanceQuestion** - Performance questionnaires

## Schema Changes

### ReviewSubmission Updates:
- Changed `jobId` → `quoteId` (more accurate naming)
- Removed `brand` column (using `companyId` consistently)

### Added Foreign Key Constraints:
- All settings tables now have CASCADE delete on company removal
- Better data integrity and automatic cleanup

## Migration Steps

To apply these changes to your database:

```bash
# 1. Generate Prisma client with new schema
npm run db:generate

# 2. Apply the migration
npm run db:migrate

# 3. (Optional) Re-seed the database
npm run db:seed
```

## Rollback

If you need to rollback, you can restore the previous schema from git:

```bash
git checkout HEAD~1 -- prisma/schema.prisma
npm run db:generate
npm run db:migrate
```

## Impact

### Positive:
- ✅ Simpler, more focused database schema
- ✅ Reduced complexity and maintenance
- ✅ Better performance (fewer tables to query)
- ✅ Clearer data model for quote system

### Breaking Changes:
- ❌ Any code referencing Job, Inventory, Costing, Activity tables will break
- ❌ Old migrations and seed data for removed tables no longer relevant

## Related Files Updated:
- `prisma/schema.prisma` - New schema definition
- `prisma/seed.ts` - Updated seed script
- `prisma/migrations/20250215000000_cleanup_unnecessary_tables/migration.sql` - Migration file
