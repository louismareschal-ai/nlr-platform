-- Migration 003: Athlete profiles (public, no auth required)

-- Public athlete profiles scraped from playerzone
CREATE TABLE IF NOT EXISTS athlete_profiles (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  playerzone_id   text UNIQUE,           -- e.g. "5413"
  playerzone_url  text,                  -- full profile URL on playerzone
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  country         text,                  -- ISO 2-letter code
  club            text,
  gender          text CHECK (gender IN ('man', 'woman', 'other')),
  photo_url       text,
  bio             text,
  -- Aggregated career stats (updated by scraper)
  total_wins      int NOT NULL DEFAULT 0,
  total_losses    int NOT NULL DEFAULT 0,
  total_draws     int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Tournament results per athlete (one row per tournament+division)
CREATE TABLE IF NOT EXISTS athlete_tournament_results (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  athlete_id      uuid NOT NULL REFERENCES athlete_profiles(id) ON DELETE CASCADE,
  tournament_name text NOT NULL,
  tournament_date date,
  season          text,                  -- "2024", "2025", "2026"
  division        text,                  -- "open", "women", "mixed"
  placement       int,                   -- 1=1st, 2=2nd, etc.
  team_name       text,                  -- partner/team name
  points_earned   numeric,
  source          text,                  -- "playerzone_fr", "playerzone_de"
  source_url      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (athlete_id, tournament_name, division, season)
);

-- Link platform players to athlete profiles
ALTER TABLE players ADD COLUMN IF NOT EXISTS athlete_profile_id uuid REFERENCES athlete_profiles(id) ON DELETE SET NULL;

-- RLS: athlete profiles are publicly readable
ALTER TABLE athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE athlete_tournament_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "athlete_profiles_public_read" ON athlete_profiles
  FOR SELECT USING (true);
CREATE POLICY "athlete_profiles_service_write" ON athlete_profiles
  FOR ALL TO service_role USING (true);

CREATE POLICY "athlete_results_public_read" ON athlete_tournament_results
  FOR SELECT USING (true);
CREATE POLICY "athlete_results_service_write" ON athlete_tournament_results
  FOR ALL TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_athlete_profiles_playerzone_id ON athlete_profiles(playerzone_id);
CREATE INDEX IF NOT EXISTS idx_athlete_results_athlete_id ON athlete_tournament_results(athlete_id);
CREATE INDEX IF NOT EXISTS idx_athlete_results_season ON athlete_tournament_results(season);
