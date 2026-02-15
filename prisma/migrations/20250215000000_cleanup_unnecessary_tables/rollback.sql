-- Rollback script for cleanup migration
-- WARNING: This will recreate the dropped tables but data will be lost!

-- Revert ReviewSubmission changes
ALTER TABLE "review_submissions" 
  RENAME COLUMN "quoteId" TO "jobId";

ALTER TABLE "review_submissions" 
  ADD COLUMN "brand" VARCHAR(255);

-- Recreate dropped tables (structure only, data will not be restored)
CREATE TABLE IF NOT EXISTS "jobs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "movewareJobId" VARCHAR(255) NOT NULL UNIQUE,
  "companyId" VARCHAR(255) NOT NULL,
  "customerId" VARCHAR(255),
  "customerName" VARCHAR(255),
  "status" VARCHAR(50) NOT NULL,
  "scheduledDate" TIMESTAMP,
  "completedDate" TIMESTAMP,
  "originAddress" TEXT,
  "destinationAddress" TEXT,
  "data" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "costings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "category" VARCHAR(100) NOT NULL,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "unit" VARCHAR(50) NOT NULL DEFAULT 'unit',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "data" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "activities" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" VARCHAR(255) NOT NULL,
  "companyId" VARCHAR(255) NOT NULL,
  "movewareId" VARCHAR(255),
  "activityType" VARCHAR(100) NOT NULL,
  "description" TEXT NOT NULL,
  "status" VARCHAR(50) NOT NULL,
  "assignedTo" VARCHAR(255),
  "scheduledDate" TIMESTAMP,
  "completedDate" TIMESTAMP,
  "notes" TEXT,
  "data" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "inventory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" VARCHAR(255) NOT NULL,
  "companyId" VARCHAR(255) NOT NULL,
  "movewareId" VARCHAR(255),
  "itemName" VARCHAR(255) NOT NULL,
  "category" VARCHAR(100),
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "volume" DECIMAL(10,2),
  "weight" DECIMAL(10,2),
  "fragile" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "room" VARCHAR(100),
  "data" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "performance_metrics" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "jobId" VARCHAR(255) NOT NULL,
  "companyId" VARCHAR(255) NOT NULL,
  "metricType" VARCHAR(100) NOT NULL,
  "value" DECIMAL(10,2) NOT NULL,
  "unit" VARCHAR(50),
  "notes" TEXT,
  "recordedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "performance_questions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" VARCHAR(255) NOT NULL,
  "question" TEXT NOT NULL,
  "category" VARCHAR(100),
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS "jobs_companyId_idx" ON "jobs"("companyId");
CREATE INDEX IF NOT EXISTS "jobs_movewareJobId_idx" ON "jobs"("movewareJobId");
CREATE INDEX IF NOT EXISTS "costings_companyId_idx" ON "costings"("companyId");
CREATE INDEX IF NOT EXISTS "costings_category_idx" ON "costings"("category");
CREATE INDEX IF NOT EXISTS "activities_jobId_idx" ON "activities"("jobId");
CREATE INDEX IF NOT EXISTS "activities_companyId_idx" ON "activities"("companyId");
CREATE INDEX IF NOT EXISTS "inventory_jobId_idx" ON "inventory"("jobId");
CREATE INDEX IF NOT EXISTS "inventory_companyId_idx" ON "inventory"("companyId");
CREATE INDEX IF NOT EXISTS "performance_metrics_jobId_idx" ON "performance_metrics"("jobId");
CREATE INDEX IF NOT EXISTS "performance_metrics_companyId_idx" ON "performance_metrics"("companyId");
CREATE INDEX IF NOT EXISTS "performance_metrics_metricType_idx" ON "performance_metrics"("metricType");
CREATE INDEX IF NOT EXISTS "performance_questions_companyId_idx" ON "performance_questions"("companyId");
CREATE INDEX IF NOT EXISTS "performance_questions_category_idx" ON "performance_questions"("category");
