-- Drop unnecessary tables
-- This migration removes tables not needed for the quote system

-- Drop tables in order to avoid foreign key constraint errors
DROP TABLE IF EXISTS "performance_metrics" CASCADE;
DROP TABLE IF EXISTS "performance_questions" CASCADE;
DROP TABLE IF EXISTS "inventory" CASCADE;
DROP TABLE IF EXISTS "activities" CASCADE;
DROP TABLE IF EXISTS "costings" CASCADE;
DROP TABLE IF EXISTS "jobs" CASCADE;

-- Update ReviewSubmission table
-- Change jobId to quoteId for better clarity
ALTER TABLE "review_submissions" 
  RENAME COLUMN "jobId" TO "quoteId";

-- Remove brand column (now using companyId consistently)
ALTER TABLE "review_submissions" 
  DROP COLUMN IF EXISTS "brand";

-- Add foreign key constraints for better data integrity
ALTER TABLE "quotes" 
  ADD CONSTRAINT "quotes_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;

ALTER TABLE "hero_settings" 
  ADD CONSTRAINT "hero_settings_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;

ALTER TABLE "branding_settings" 
  ADD CONSTRAINT "branding_settings_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;

ALTER TABLE "copy_settings" 
  ADD CONSTRAINT "copy_settings_companyId_fkey" 
  FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE;
