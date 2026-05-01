-- NLR Platform — Initial Schema
-- Run this in your Supabase SQL editor or via Supabase CLI

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Tournaments ─────────────────────────────────────────────────────────────

CREATE TABLE tournaments (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  slug        text UNIQUE NOT NULL,
  date        date NOT NULL,
  location    text,
  status      text NOT NULL DEFAULT 'setup'
                CHECK (status IN ('setup', 'registration', 'active', 'completed')),
  courts_count int NOT NULL DEFAULT 12,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Squads ──────────────────────────────────────────────────────────────────

CREATE TABLE squads (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id  uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name           text NOT NULL,
  seed           int,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── Players (extends auth.users) ────────────────────────────────────────────

CREATE TABLE players (
  id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  squad_id               uuid REFERENCES squads(id) ON DELETE SET NULL,
  first_name             text NOT NULL,
  last_name              text NOT NULL,
  gender                 text NOT NULL CHECK (gender IN ('man', 'woman')),
  role                   text NOT NULL DEFAULT 'player'
                           CHECK (role IN ('player', 'squad_admin', 'super_admin')),
  temp_password_changed  boolean NOT NULL DEFAULT false,
  playerzone_id          text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

-- ─── Player Points (per tournament, imported + tweakable) ────────────────────

CREATE TABLE player_tournament_points (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id      uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tournament_id  uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  mixed_points   numeric NOT NULL DEFAULT 0,
  open_points    numeric NOT NULL DEFAULT 0,
  women_points   numeric NOT NULL DEFAULT 0,
  UNIQUE (player_id, tournament_id)
);

-- ─── Courts ──────────────────────────────────────────────────────────────────

CREATE TABLE courts (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id  uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name           text NOT NULL,
  number         int NOT NULL
);

-- ─── Rounds ──────────────────────────────────────────────────────────────────

CREATE TABLE rounds (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id    uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round_number     int NOT NULL,
  name             text NOT NULL,
  scheduled_start  timestamptz,
  status           text NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'active', 'completed'))
);

-- ─── Encounters (bracket matchups) ───────────────────────────────────────────

CREATE TABLE encounters (
  id                              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id                        uuid NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  tournament_id                   uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  squad_a_id                      uuid REFERENCES squads(id),
  squad_b_id                      uuid REFERENCES squads(id),
  bracket_slot                    text NOT NULL,
  winner_id                       uuid REFERENCES squads(id),
  loser_id                        uuid REFERENCES squads(id),
  squad_a_composition_submitted   boolean NOT NULL DEFAULT false,
  squad_b_composition_submitted   boolean NOT NULL DEFAULT false,
  composition_revealed            boolean NOT NULL DEFAULT false,
  status                          text NOT NULL DEFAULT 'pending'
                                    CHECK (status IN (
                                      'pending', 'composition', 'mixed_round',
                                      'open_round', 'scoring', 'completed'
                                    ))
);

-- ─── Compositions (per squad per encounter) ───────────────────────────────────

CREATE TABLE compositions (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  encounter_id        uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  squad_id            uuid NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
  -- Mixed 1 (highest mixed points pair)
  mixed1_man_id       uuid NOT NULL REFERENCES players(id),
  mixed1_woman_id     uuid NOT NULL REFERENCES players(id),
  -- Mixed 2
  mixed2_man_id       uuid NOT NULL REFERENCES players(id),
  mixed2_woman_id     uuid NOT NULL REFERENCES players(id),
  -- Open 1 (highest open points pair)
  open1_player1_id    uuid NOT NULL REFERENCES players(id),
  open1_player2_id    uuid NOT NULL REFERENCES players(id),
  -- Open 2
  open2_player1_id    uuid NOT NULL REFERENCES players(id),
  open2_player2_id    uuid NOT NULL REFERENCES players(id),
  -- Women always plays both (no choice needed)
  submitted_at        timestamptz,
  UNIQUE (encounter_id, squad_id)
);

-- ─── Games (5 per encounter) ─────────────────────────────────────────────────

CREATE TABLE games (
  id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  encounter_id       uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  game_type          text NOT NULL
                       CHECK (game_type IN ('mixed1', 'mixed2', 'open1', 'open2', 'women')),
  court_id           uuid REFERENCES courts(id),
  encounter_round    int NOT NULL CHECK (encounter_round IN (1, 2)),
  -- 1 = mixed round (mixed1, mixed2), 2 = open/women round (open1, open2, women)
  winner_squad_id    uuid REFERENCES squads(id),
  -- Score submission workflow
  score_entered_by   uuid REFERENCES squads(id),
  score_entered_at   timestamptz,
  score_confirmed_by uuid REFERENCES squads(id),
  score_confirmed_at timestamptz,
  score_status       text NOT NULL DEFAULT 'pending'
                       CHECK (score_status IN ('pending', 'submitted', 'confirmed', 'disputed')),
  -- Sets stored as JSONB: [{set_number: 1, score_a: 15, score_b: 12}, ...]
  sets               jsonb NOT NULL DEFAULT '[]',
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'active', 'completed'))
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────

CREATE INDEX idx_squads_tournament ON squads(tournament_id);
CREATE INDEX idx_players_squad ON players(squad_id);
CREATE INDEX idx_player_points_tournament ON player_tournament_points(tournament_id);
CREATE INDEX idx_courts_tournament ON courts(tournament_id);
CREATE INDEX idx_rounds_tournament ON rounds(tournament_id);
CREATE INDEX idx_encounters_tournament ON encounters(tournament_id);
CREATE INDEX idx_encounters_round ON encounters(round_id);
CREATE INDEX idx_games_encounter ON games(encounter_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_tournament_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE compositions ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM players WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper: get current user's squad_id
CREATE OR REPLACE FUNCTION get_my_squad_id()
RETURNS uuid AS $$
  SELECT squad_id FROM players WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ─── RLS Policies ────────────────────────────────────────────────────────────

-- Tournaments: readable by all authenticated users, writable by super_admin
CREATE POLICY "tournaments_read" ON tournaments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "tournaments_write" ON tournaments
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin');

-- Squads: readable by all, writable by super_admin
CREATE POLICY "squads_read" ON squads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "squads_write" ON squads
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin');

-- Players: readable by all, writable by super_admin or squad_admin (own squad)
CREATE POLICY "players_read" ON players
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "players_write_superadmin" ON players
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin');
CREATE POLICY "players_write_own" ON players
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Player points: readable by all, writable by super_admin
CREATE POLICY "points_read" ON player_tournament_points
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "points_write" ON player_tournament_points
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin');

-- Courts: readable by all, writable by super_admin
CREATE POLICY "courts_read" ON courts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "courts_write" ON courts
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin');

-- Rounds: readable by all, writable by super_admin
CREATE POLICY "rounds_read" ON rounds
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rounds_write" ON rounds
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin');

-- Encounters: readable by all, writable by super_admin
CREATE POLICY "encounters_read" ON encounters
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "encounters_write" ON encounters
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin');

-- Compositions: readable by all (revealed only after both submit — enforced in app layer)
-- Writable by own squad_admin or super_admin
CREATE POLICY "compositions_read" ON compositions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "compositions_write_own" ON compositions
  FOR INSERT TO authenticated
  WITH CHECK (
    squad_id = get_my_squad_id() AND get_my_role() IN ('squad_admin', 'super_admin')
  );
CREATE POLICY "compositions_update_own" ON compositions
  FOR UPDATE TO authenticated
  USING (
    squad_id = get_my_squad_id() AND get_my_role() IN ('squad_admin', 'super_admin')
  );
CREATE POLICY "compositions_write_superadmin" ON compositions
  FOR ALL TO authenticated USING (get_my_role() = 'super_admin');

-- Games: readable by all, score entry by squad_admin of involved squads or super_admin
CREATE POLICY "games_read" ON games
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "games_score_entry" ON games
  FOR UPDATE TO authenticated
  USING (
    get_my_role() IN ('squad_admin', 'super_admin')
  );

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Enable realtime on tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE encounters;
ALTER PUBLICATION supabase_realtime ADD TABLE compositions;
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
