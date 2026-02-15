-- Migration: Create companies table with constraints and triggers
-- This migration creates the companies table with all required constraints,
-- indexes, and triggers for data integrity and optimistic locking.

-- Drop existing companies table if it exists (this is a restructure)
DROP TABLE IF EXISTS companies CASCADE;

-- Create companies table with UUID primary key
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  brand_code VARCHAR(100) NOT NULL,
  primary_color VARCHAR(7),
  secondary_color VARCHAR(7),
  tertiary_color VARCHAR(7),
  logo_url TEXT,
  hero_content TEXT,
  copy_content TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Check constraints for hex color format (#RRGGBB)
  CONSTRAINT check_primary_color_format 
    CHECK (primary_color IS NULL OR primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT check_secondary_color_format 
    CHECK (secondary_color IS NULL OR secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT check_tertiary_color_format 
    CHECK (tertiary_color IS NULL OR tertiary_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create unique index on brand_code (case-insensitive)
CREATE UNIQUE INDEX idx_companies_brand_code ON companies (brand_code);

-- Create unique index on lowercase brand_code for case-insensitive uniqueness
CREATE UNIQUE INDEX idx_companies_brand_code_lower ON companies (LOWER(brand_code));

-- Create index on id for faster lookups
CREATE INDEX idx_companies_id ON companies (id);

-- Create trigger function for automatically updating updated_at timestamp
-- This provides optimistic locking capability by ensuring updated_at changes on every update
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before any UPDATE on companies
CREATE TRIGGER trigger_update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_companies_updated_at();

-- ============================================================================
-- FOREIGN KEY REFERENCE DOCUMENTATION
-- ============================================================================
-- When creating tables that reference the companies table, use:
--
--   FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
--
-- The ON DELETE RESTRICT constraint prevents deletion of a company record if
-- there are any dependent records in other tables. This ensures referential
-- integrity and prevents orphaned records.
--
-- Example:
--   CREATE TABLE jobs (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     company_id UUID NOT NULL,
--     ...
--     FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
--   );
--
-- If you need to delete a company, you must first delete or reassign all
-- dependent records in related tables.
-- ============================================================================

-- Add comment to the table for documentation
COMMENT ON TABLE companies IS 'Stores company information including branding settings and content customization';
COMMENT ON COLUMN companies.id IS 'UUID primary key, auto-generated using gen_random_uuid()';
COMMENT ON COLUMN companies.brand_code IS 'Unique identifier for the company brand (case-insensitive)';
COMMENT ON COLUMN companies.primary_color IS 'Primary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN companies.secondary_color IS 'Secondary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN companies.tertiary_color IS 'Tertiary brand color in hex format (#RRGGBB)';
COMMENT ON COLUMN companies.logo_url IS 'URL to the company logo image';
COMMENT ON COLUMN companies.hero_content IS 'JSON or text content for hero section customization';
COMMENT ON COLUMN companies.copy_content IS 'JSON or text content for copy/messaging customization';
COMMENT ON COLUMN companies.updated_at IS 'Timestamp of last update, automatically maintained by trigger for optimistic locking';
