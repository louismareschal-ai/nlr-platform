-- Migration 004: Organizations

CREATE TABLE IF NOT EXISTS organizations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  type            text NOT NULL CHECK (type IN ('national_federation', 'regional_federation', 'club', 'tournament_organizer')),
  country         text,
  website         text,
  logo_url        text,
  playerzone_domain text,               -- their playerzone domain if they have one
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Link tournaments to organizations
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;

-- RLS: public read
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizations_public_read" ON organizations FOR SELECT USING (true);
CREATE POLICY "organizations_service_write" ON organizations FOR ALL TO service_role USING (true);
