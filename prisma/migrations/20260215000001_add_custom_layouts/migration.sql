-- CreateTable
CREATE TABLE IF NOT EXISTS "custom_layouts" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "layoutConfig" TEXT NOT NULL,
    "reference_url" VARCHAR(2000),
    "reference_file" VARCHAR(500),
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "conversation_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "custom_layouts_company_id_key" ON "custom_layouts"("company_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "custom_layouts_company_id_idx" ON "custom_layouts"("company_id");

-- AddForeignKey
ALTER TABLE "custom_layouts" ADD CONSTRAINT "custom_layouts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
