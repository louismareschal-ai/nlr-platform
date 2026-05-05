-- Add photo_url to players (sourced from playerzone)
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url text;
