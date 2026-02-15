# Migration: Create Companies Table with Constraints

## Overview

This migration creates the `companies` table with comprehensive constraints, indexes, and triggers for data integrity and optimistic locking.

## Table Structure

### Columns

- **id** (UUID): Primary key, auto-generated using `gen_random_uuid()`
- **name** (VARCHAR 255): Company name, required
- **brand_code** (VARCHAR 100): Unique brand identifier, required, case-insensitive
- **primary_color** (VARCHAR 7): Primary brand color in hex format, nullable
- **secondary_color** (VARCHAR 7): Secondary brand color in hex format, nullable
- **tertiary_color** (VARCHAR 7): Tertiary brand color in hex format, nullable
- **logo_url** (TEXT): URL to company logo, nullable
- **hero_content** (TEXT): Hero section content, nullable
- **copy_content** (TEXT): Marketing copy content, nullable
- **created_at** (TIMESTAMP): Record creation timestamp, defaults to NOW()
- **updated_at** (TIMESTAMP): Last update timestamp, auto-maintained by trigger

## Constraints

### Check Constraints

All color fields enforce valid hex color format:
- Pattern: `#[0-9A-Fa-f]{6}`
- Example valid values: `#2563eb`, `#FF0000`, `#a1b2c3`
- NULL values are allowed

### Unique Constraints

- **brand_code**: Must be unique (case-insensitive)
- Index on `LOWER(brand_code)` ensures uniqueness regardless of case

## Indexes

1. **Primary Key Index**: On `id` column (automatic)
2. **Unique Brand Code Index**: On `LOWER(brand_code)` for case-insensitive uniqueness
3. **ID Lookup Index**: On `id` for faster foreign key lookups

## Triggers

### Updated At Trigger

Automatically updates the `updated_at` column whenever a row is modified:
- Trigger: `companies_updated_at_trigger`
- Function: `update_companies_updated_at()`
- Purpose: Enables optimistic locking and audit trail

## Foreign Key Pattern

**IMPORTANT**: When creating tables that reference companies, always use `ON DELETE RESTRICT`:

```sql
ALTER TABLE "your_table"
  ADD CONSTRAINT "fk_your_table_company"
  FOREIGN KEY ("company_id")
  REFERENCES "companies"("id")
  ON DELETE RESTRICT;
```

This prevents:
- Accidental deletion of companies with dependent records
- Data integrity violations
- Orphaned records in child tables

## Usage Examples

### Insert a New Company

```sql
INSERT INTO "companies" ("name", "brand_code", "primary_color", "secondary_color")
VALUES ('Acme Corp', 'ACME', '#2563eb', '#1e40af');
```

### Update Company Colors

```sql
UPDATE "companies"
SET "primary_color" = '#ff0000',
    "secondary_color" = '#cc0000'
WHERE "brand_code" = 'ACME';
-- updated_at will be automatically set to NOW()
```

### Query with Case-Insensitive Brand Code

```sql
SELECT * FROM "companies"
WHERE LOWER("brand_code") = LOWER('acme');
-- Uses the index for efficient lookup
```

## Rollback

To rollback this migration:

```sql
DROP TRIGGER IF EXISTS "companies_updated_at_trigger" ON "companies";
DROP FUNCTION IF EXISTS update_companies_updated_at();
DROP TABLE IF EXISTS "companies" CASCADE;
```

**Warning**: `CASCADE` will also drop all foreign key constraints referencing this table.

## Notes

- The migration enables the `pgcrypto` extension for UUID generation
- Color validation is enforced at the database level
- The `updated_at` trigger provides automatic timestamp management
- Case-insensitive brand code uniqueness prevents duplicate entries like 'ACME' and 'acme'
