-- CreateTable: companies with comprehensive constraints
-- This migration creates the companies table with all required fields,
-- constraints, indexes, and triggers for data integrity and optimistic locking.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create companies table
CREATE TABLE IF NOT EXISTS "companies" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "brand_code" VARCHAR(100) NOT NULL UNIQUE,
    "primary_color" VARCHAR(7),
    "secondary_color" VARCHAR(7),
    "tertiary_color" VARCHAR(7),
    "logo_url" TEXT,
    "hero_content" TEXT,
    "copy_content" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Check constraints for hex color format
    CONSTRAINT "valid_primary_color" CHECK (
        "primary_color" IS NULL OR "primary_color" ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT "valid_secondary_color" CHECK (
        "secondary_color" IS NULL OR "secondary_color" ~ '^#[0-9A-Fa-f]{6}$'
    ),
    CONSTRAINT "valid_tertiary_color" CHECK (
        "tertiary_color" IS NULL OR "tertiary_color" ~ '^#[0-9A-Fa-f]{6}$'
    )
);

-- Create unique index on lowercase brand_code for case-insensitive uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS "companies_brand_code_lower_idx" 
    ON "companies" (LOWER("brand_code"));

-- Create index on id for faster lookups
CREATE INDEX IF NOT EXISTS "companies_id_idx" ON "companies" ("id");

-- Create function for automatic updated_at timestamp
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updated_at" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row modification
DROP TRIGGER IF EXISTS "companies_updated_at_trigger" ON "companies";
CREATE TRIGGER "companies_updated_at_trigger"
    BEFORE UPDATE ON "companies"
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

-- Add comments for documentation
COMMENT ON TABLE "companies" IS 'Company master table with branding and configuration settings';
COMMENT ON COLUMN "companies"."id" IS 'Unique company identifier (UUID)';
COMMENT ON COLUMN "companies"."brand_code" IS 'Unique brand identifier code (case-insensitive)';
COMMENT ON COLUMN "companies"."primary_color" IS 'Primary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN "companies"."secondary_color" IS 'Secondary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN "companies"."tertiary_color" IS 'Tertiary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN "companies"."updated_at" IS 'Last update timestamp, automatically maintained by trigger for optimistic locking';

-- Documentation: Foreign Key Constraint Pattern
-- When creating tables that reference companies, use ON DELETE RESTRICT:
--
-- Example:
-- CREATE TABLE "jobs" (
--     "id" UUID PRIMARY KEY,
--     "company_id" UUID NOT NULL,
--     CONSTRAINT "fk_jobs_company" FOREIGN KEY ("company_id") 
--         REFERENCES "companies"("id") ON DELETE RESTRICT
-- );
--
-- This prevents deletion of companies that have related records,
-- ensuring referential integrity across the database.
