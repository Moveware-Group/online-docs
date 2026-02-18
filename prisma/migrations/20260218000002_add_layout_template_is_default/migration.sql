-- Add is_default flag to layout_templates.
-- Only one template should have is_default = TRUE at a time (enforced via
-- application logic — when a template is set as default all others are cleared).

ALTER TABLE layout_templates ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE;
