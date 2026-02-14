-- AlterTable: Add company settings columns to companies table
-- This migration adds branding and customization fields directly to the companies table

-- Add primary_color column with default value from design system
ALTER TABLE "companies" ADD COLUMN "primaryColor" VARCHAR(7) NOT NULL DEFAULT '#2563eb';

-- Add secondary_color column with default value from design system
ALTER TABLE "companies" ADD COLUMN "secondaryColor" VARCHAR(7) NOT NULL DEFAULT '#1e40af';

-- Add tertiary_color column with default value from design system
ALTER TABLE "companies" ADD COLUMN "tertiaryColor" VARCHAR(7) NOT NULL DEFAULT '#60a5fa';

-- Add logo_url column (nullable)
ALTER TABLE "companies" ADD COLUMN "logoUrl" VARCHAR(500);

-- Add updated_by column to track who made the last update (nullable)
ALTER TABLE "companies" ADD COLUMN "updatedBy" TEXT;

-- Add index on id column (primary key already has implicit index, but adding for clarity)
CREATE INDEX IF NOT EXISTS "companies_id_idx" ON "companies"("id");

-- Comment on columns for documentation
COMMENT ON COLUMN "companies"."primaryColor" IS 'Primary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN "companies"."secondaryColor" IS 'Secondary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN "companies"."tertiaryColor" IS 'Tertiary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN "companies"."logoUrl" IS 'URL or path to company logo image (max 500 characters)';
COMMENT ON COLUMN "companies"."updatedBy" IS 'User ID of the person who last updated company settings';
