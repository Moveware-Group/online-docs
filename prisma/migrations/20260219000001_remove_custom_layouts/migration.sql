-- Migration: Remove custom_layouts table
-- Custom layouts have been consolidated into layout_templates.
-- Run POST /api/layouts/migrate BEFORE applying this migration to promote
-- any existing custom_layouts records to layout_templates first.

DROP TABLE IF EXISTS "custom_layouts";
