-- Migration: add footer/weight fields to branding_settings
-- These fields were used in code but were never added to the schema.

ALTER TABLE branding_settings
  ADD COLUMN IF NOT EXISTS inventory_weight_unit VARCHAR(10)  NOT NULL DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS footer_bg_color       VARCHAR(7)   NULL,
  ADD COLUMN IF NOT EXISTS footer_text_color     VARCHAR(7)   NULL,
  ADD COLUMN IF NOT EXISTS footer_address_line1  VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS footer_address_line2  VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS footer_phone          VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS footer_email          VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS footer_abn            VARCHAR(50)  NULL;
