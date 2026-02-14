-- AlterTable: Add tenant scoping and multi-tenant fields to companies table
ALTER TABLE "companies" ADD COLUMN "tenant_id" VARCHAR(255),
                        ADD COLUMN "brand_code" VARCHAR(255),
                        ADD COLUMN "hero_content" TEXT,
                        ADD COLUMN "copy_content" TEXT,
                        ALTER COLUMN "name" TYPE VARCHAR(255);

-- Update existing records to have default values for new required fields
UPDATE "companies" SET "tenant_id" = 'default', "brand_code" = "id" WHERE "tenant_id" IS NULL;

-- Make tenant_id and brand_code NOT NULL after setting defaults
ALTER TABLE "companies" ALTER COLUMN "tenant_id" SET NOT NULL,
                        ALTER COLUMN "brand_code" SET NOT NULL;

-- CreateIndex: Add index on company name for query performance
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex: Add index on tenant_id for query performance
CREATE INDEX "companies_tenant_id_idx" ON "companies"("tenant_id");

-- CreateIndex: Add unique constraint on (tenant_id, brand_code) to prevent duplicates
CREATE UNIQUE INDEX "companies_tenant_id_brand_code_key" ON "companies"("tenant_id", "brand_code");
