# Database Migrations

## How to apply

Go to your [Supabase project](https://supabase.com/dashboard) → **SQL Editor** → **New query**, paste the SQL, and click **Run**.

Migrations must be applied in order. Migrations 001 and 002 are already applied (they're part of the initial setup). Apply 003 and 004 below.

---

## 003 — Athlete profiles & tournament results

**File:** `supabase/migrations/003_athlete_profiles.sql`

This creates:
- `athlete_profiles` — scraped player data (name, country, club, photo, career stats)
- `athlete_tournament_results` — per-tournament placement + points per athlete
- Foreign key on `players.athlete_profile_id` linking to `athlete_profiles`
- Public read RLS on both tables

After applying: run `node scripts/scrape-playerzone.mjs` to populate it.

---

## 004 — Organizations (multi-federation groundwork)

**File:** `supabase/migrations/004_organizations.sql`

This creates:
- `organizations` — federations, clubs, tournament organizers
- `organization_members` — user-to-org membership with role
- `tournaments.organization_id` FK column

Not strictly required for NLR 2026, but lays the multi-org architecture groundwork.

---

## Alternative: apply via script

If you have the database password:

```bash
DB_PASSWORD=<your-db-password> node scripts/apply-migrations.mjs 003
DB_PASSWORD=<your-db-password> node scripts/apply-migrations.mjs 004
```

The DB password is in Supabase Dashboard → **Project Settings** → **Database** → **Database password**.

---

## After migrations

1. Run the scraper to populate athlete profiles:
   ```bash
   node scripts/scrape-playerzone.mjs
   ```

2. Seed test data (8 squads, 48 players) for NLR 2026:
   ```bash
   node scripts/seed-test-data.mjs
   ```
