-- Drop unnecessary tables
-- This migration removes tables not needed for the quote system

-- Drop tables in order to avoid foreign key constraint errors
DROP TABLE IF EXISTS "performance_metrics" CASCADE;
DROP TABLE IF EXISTS "performance_questions" CASCADE;
DROP TABLE IF EXISTS "inventory" CASCADE;
DROP TABLE IF EXISTS "activities" CASCADE;
DROP TABLE IF EXISTS "costings" CASCADE;
DROP TABLE IF EXISTS "jobs" CASCADE;

-- Update ReviewSubmission table (only if columns exist)
-- Change jobId to quoteId for better clarity
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'review_submissions' AND column_name = 'jobId'
  ) THEN
    ALTER TABLE "review_submissions" RENAME COLUMN "jobId" TO "quoteId";
  END IF;
END $$;

-- Remove brand column (now using companyId consistently)
ALTER TABLE "review_submissions" 
  DROP COLUMN IF EXISTS "brand";

-- Note: Skipping foreign key constraints due to type mismatches in existing database
-- Foreign keys can be added manually after fixing data types if needed
