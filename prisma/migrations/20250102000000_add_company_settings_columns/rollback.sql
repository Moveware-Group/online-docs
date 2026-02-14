-- Rollback migration: Remove company settings columns from companies table
-- Run this script to undo the changes from migration.sql

-- Remove index (if it was created)
DROP INDEX IF EXISTS "companies_id_idx";

-- Remove columns in reverse order
ALTER TABLE "companies" DROP COLUMN IF EXISTS "updatedBy";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "logoUrl";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "tertiaryColor";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "secondaryColor";
ALTER TABLE "companies" DROP COLUMN IF EXISTS "primaryColor";
