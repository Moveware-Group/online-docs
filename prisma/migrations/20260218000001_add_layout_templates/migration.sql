-- CreateTable: layout_templates
CREATE TABLE IF NOT EXISTS "layout_templates" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "layoutConfig" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "layout_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "layout_templates_name_idx" ON "layout_templates"("name");

-- AddColumn: layout_template_id to branding_settings (if not already present)
ALTER TABLE "branding_settings"
    ADD COLUMN IF NOT EXISTS "layout_template_id" TEXT;

-- AddForeignKey: branding_settings -> layout_templates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'branding_settings_layout_template_id_fkey'
    ) THEN
        ALTER TABLE "branding_settings"
            ADD CONSTRAINT "branding_settings_layout_template_id_fkey"
            FOREIGN KEY ("layout_template_id")
            REFERENCES "layout_templates"("id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateIndex on branding_settings.layout_template_id
CREATE INDEX IF NOT EXISTS "branding_settings_layout_template_id_idx"
    ON "branding_settings"("layout_template_id");
