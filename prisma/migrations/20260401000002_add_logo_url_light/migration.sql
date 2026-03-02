-- Migration: add logo_url_light to branding_settings
-- Stores an alternate logo optimised for dark backgrounds (e.g. white logo for dark footers).

ALTER TABLE branding_settings
  ADD COLUMN IF NOT EXISTS logo_url_light TEXT NULL;
