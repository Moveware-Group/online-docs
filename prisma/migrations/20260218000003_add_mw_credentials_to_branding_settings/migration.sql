-- Add Moveware API credentials to branding_settings
-- mw_username: the username for Basic Auth against the Moveware REST API
-- mw_password: the password (stored server-side, never exposed to the browser)
ALTER TABLE branding_settings ADD COLUMN mw_username VARCHAR(255);
ALTER TABLE branding_settings ADD COLUMN mw_password VARCHAR(500);
