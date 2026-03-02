-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: add_doc_type_management
--
-- 1. Add `doc_type` column to layout_templates (default "quote" for all existing)
-- 2. Add `is_default` column to layout_templates if not already present
-- 3. Create company_document_layouts junction table
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add doc_type to layout_templates
ALTER TABLE "layout_templates"
    ADD COLUMN IF NOT EXISTS "doc_type" VARCHAR(50) NOT NULL DEFAULT 'quote';

CREATE INDEX IF NOT EXISTS "layout_templates_doc_type_idx"
    ON "layout_templates"("doc_type");

-- 2. Add is_default to layout_templates if not already present
--    (may have been added by a previous migration)
ALTER TABLE "layout_templates"
    ADD COLUMN IF NOT EXISTS "is_default" BOOLEAN NOT NULL DEFAULT false;

-- 3. Create company_document_layouts junction table
CREATE TABLE IF NOT EXISTS "company_document_layouts" (
    "id"          TEXT        NOT NULL,
    "company_id"  TEXT        NOT NULL,
    "doc_type"    VARCHAR(50) NOT NULL,
    "template_id" TEXT        NOT NULL,
    "is_active"   BOOLEAN     NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_document_layouts_pkey" PRIMARY KEY ("id")
);

-- Unique: one layout per (company, doc_type)
CREATE UNIQUE INDEX IF NOT EXISTS "company_document_layouts_company_id_doc_type_key"
    ON "company_document_layouts"("company_id", "doc_type");

CREATE INDEX IF NOT EXISTS "company_document_layouts_company_id_idx"
    ON "company_document_layouts"("company_id");

CREATE INDEX IF NOT EXISTS "company_document_layouts_doc_type_idx"
    ON "company_document_layouts"("doc_type");

-- Foreign keys
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'company_document_layouts_company_id_fkey'
    ) THEN
        ALTER TABLE "company_document_layouts"
            ADD CONSTRAINT "company_document_layouts_company_id_fkey"
            FOREIGN KEY ("company_id")
            REFERENCES "companies"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'company_document_layouts_template_id_fkey'
    ) THEN
        ALTER TABLE "company_document_layouts"
            ADD CONSTRAINT "company_document_layouts_template_id_fkey"
            FOREIGN KEY ("template_id")
            REFERENCES "layout_templates"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
