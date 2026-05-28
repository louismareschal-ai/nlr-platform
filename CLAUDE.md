# NLR Platform — CLAUDE.md

Tournament management app for Next Level Roundnet. First use case: NLR 2026 (8 squads, June 2026, Mannheim). End goal: Worlds 2026 Paris (700 athletes, September 2026).

See `docs/tournament-format.md` for the full tournament rules and format.

## Commands

```bash
npm run dev          # Dev server at localhost:3010
npm run build        # Production build
npm run lint         # ESLint
npm run test         # All Playwright tests
npm run test:logic   # Bracket logic unit tests (no server needed)
npm run test:ui      # Auth + super-admin UI tests (needs dev server + .env.test)
```

Requires **Node 20+**.

## Mobile access (phone testing)

When Louis says "I want to run it on my phone" (or any variation), run this script:

```bash
bash scripts/phone-access.sh
```

What it does: detects the WSL2 IP, writes a temp PowerShell script, triggers a UAC prompt to run `netsh portproxy` + firewall rule as admin, then prints the phone URL. The dev server must already be running (`npm run dev`). Phone must be on the same WiFi as the Windows machine.

## Testing rules — mandatory before marking any task done

1. **Always run `npm run test:logic` after touching `src/lib/tournament/bracket.ts`** — these 24 tests cover score validation, game/encounter winner logic, composition constraints, and QF seeding. They must all pass.

2. **After building or modifying any UI feature, use the Playwright MCP browser tools** (`mcp__playwright_*`) to manually walk through the affected workflow on `http://localhost:3010`. Start the dev server with `npm run dev` if it is not already running.
   - Navigate to the relevant page
   - Click through the full happy path
   - Test at least one error/edge case (empty form, wrong input, locked step)
   - Take a screenshot if something looks wrong

3. **Run `npm run test:ui` when auth flows or role routing changes.** Requires `.env.test` with E2E credentials (see below).

4. **Add a Playwright test** in `e2e/` whenever a new workflow is completed. Tests go in the file matching the role: `super-admin.spec.ts`, `squad-admin.spec.ts`, `player.spec.ts`, or `bracket-logic.spec.ts` for pure logic.

## E2E test credentials

Test accounts live in Supabase. Credentials are written to `.env.test` (gitignored).
To regenerate them: `node scripts/create-e2e-users.mjs`

Accounts:
- `e2e-super-admin@nlr-test.internal` — role: super_admin
- `e2e-squad-admin@nlr-test.internal` — role: squad_admin
- `e2e-player@nlr-test.internal` — role: player

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4** (CSS-first, no tailwind.config.js — config lives in `src/app/globals.css`)
- **Supabase** — auth, Postgres, Realtime subscriptions
- **Railway** — deployment

## Navigation architecture

All users use the same URL structure. Role determines which tabs appear, not which app you use.

**Top nav (SiteShell):** NLR Open | Tournaments | Players + Sign in/out

**Tournament sub-nav tabs (role-adaptive):**
- Bracket, Schedule, Squads (everyone)
- My Squad (squad_admin + super_admin)
- Manage (super_admin only)

**Primary routes:**
- `/` — redirects to `/tournaments`
- `/tournaments` — list with status filter
- `/tournaments/[slug]/bracket` — bracket + live scores + click-to-detail panel
- `/tournaments/[slug]/schedule` — schedule grouped by round
- `/tournaments/[slug]/squads` — squad rosters with player photos
- `/tournaments/[slug]/my-squad` — composition form or score entry for squad admin
- `/tournaments/[slug]/manage` — super_admin encounter list + links
- `/tournaments/[slug]/manage/encounters/[id]` — encounter detail (super_admin)
- `/tournaments/[slug]/manage/players` — player management (super_admin)
- `/players` + `/players/[id]` — player directory + profile

**Old routes (deprecated, still functional):** `/super-admin/*`, `/squad-admin/*`, `/player/*`
The Manage tab still links to `/super-admin/tournaments` for tournament setup. These can be removed once the Manage tab covers everything.

## Project Structure

```
src/
├── app/
│   ├── login/                Login page
│   ├── change-password/      Forced first-login password change
│   ├── tournaments/          Primary tournament routes (all roles)
│   │   ├── layout.tsx        Reads auth, wraps with SiteShell
│   │   ├── page.tsx          Tournament list
│   │   └── [slug]/
│   │       ├── layout.tsx    Fetches tournament + user role, renders TournamentSubNav
│   │       ├── bracket/      Bracket with live scores + EncounterPanel
│   │       ├── schedule/     Schedule grouped by round
│   │       ├── squads/       Squad rosters
│   │       ├── my-squad/     Composition + score entry (squad_admin+)
│   │       └── manage/       Encounter list + management (super_admin)
│   ├── players/              Player directory + profiles
│   ├── super-admin/          DEPRECATED: tournament setup flow (still linked from Manage tab)
│   ├── squad-admin/          DEPRECATED: no longer primary navigation
│   ├── player/               DEPRECATED: no longer primary navigation
│   ├── page.tsx              Root redirect to /tournaments
│   ├── layout.tsx            Root layout (fonts, metadata)
│   └── globals.css           Tailwind v4 theme tokens
├── components/
│   ├── bracket/
│   │   ├── BracketView.tsx          Visual bracket (cards are buttons when onSelect given)
│   │   ├── BracketWithPanel.tsx     Client wrapper: manages selectedEncounterId state
│   │   └── EncounterPanel.tsx       Slide-in detail panel with Realtime subscriptions
│   ├── composition/                 CompositionForm — squad composition submission
│   ├── layout/
│   │   ├── SiteShell.tsx            Unified top nav (client, handles sign-out)
│   │   └── TournamentSubNav.tsx     Role-adaptive sub-nav (client, uses usePathname)
│   ├── scoring/                     ScoreEntry — score entry + confirmation flow
│   └── ui/                          Button, Card, Badge, Input
├── lib/
│   ├── supabase/                    client.ts (browser), server.ts (SSR + createServiceClient)
│   └── tournament/                  bracket.ts — scoring logic, validation, bracket paths
├── middleware.ts                    Auth guard + role-based redirects
└── types/index.ts                   All TypeScript types
```

## Key domain logic (bracket.ts)

- `isValidSetScore(a, b)` — validates scores (to 15, win by 2, hard cap 21-20 only)
- `gameWinner(sets)` — determines BO3 winner from set scores
- `encounterWinner(gameResults)` — determines encounter winner (3 of 5)
- `validateCompositionPoints(...)` — enforces Mixed 1 >= Mixed 2 and Open 1 >= Open 2 point constraints
- `BRACKET_PATHS` — where winner and loser of each bracket slot go next
- `QF_SEEDS` — seed 1v8, 2v7, 3v6, 4v5 for quarterfinals

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Copy `.env.example` to `.env.local` and fill in from your Supabase project.

## Database

Schema: `supabase/migrations/001_initial_schema.sql`

Run this in your Supabase project's SQL editor (or via Supabase CLI).

Tables: `tournaments`, `squads`, `players`, `player_tournament_points`, `courts`, `rounds`, `encounters`, `compositions`, `games`

Realtime enabled on: `games`, `encounters`, `compositions`, `rounds`

## Design system

Colors are CSS variables in `globals.css` under `@theme {}`. Swap them to rebrand:
- `--color-void` (#050508) — page background
- `--color-gold` (#e8b84b) — accent, CTAs, highlights
- `--color-chalk` (#f0ece3) — primary text
- `--color-muted` (#6b6b7a) — secondary text

## Roles

- `super_admin` — sees all tabs including Manage
- `squad_admin` — sees My Squad tab (composition + score entry)
- `player` / unauthenticated — read-only (Bracket, Schedule, Squads)

Middleware enforces auth for legacy routes (`/super-admin`, `/squad-admin`, `/player`). First-login forced password change is enforced in middleware for non-super-admin users. The new `/tournaments/*` routes are publicly readable; sensitive actions (score entry, composition) check auth server-side.

## Web browsing rules (Playwright MCP)

When using the Playwright MCP browser on **external sites** (anything not localhost):

**Always allowed without asking:**
- Navigating to any URL to observe or read content
- Taking screenshots
- Clicking links that just navigate (no side effects)

**Always ask Louis first before:**
- Clicking any button that submits a form on an external site
- Filling in login/signup/registration forms
- Clicking anything labeled Buy, Purchase, Order, Subscribe, Checkout, Donate, Add to cart
- Creating an account or profile on any third-party service
- Posting, sending, or publishing anything on an external platform

If there is any doubt about whether an action is reversible or has a cost, ask.

## Branch rules

- Never commit to `main` directly
- Branch: `feature/<name>` → PR → merge to `main`
- `main` auto-deploys on Railway to https://live.nextlevelroundnet.com (live since 2026-05-28)

## /live page state (pre-NLR 2026-06-06)

- `data/streams.json` lists the 6 streamed courts. Fill `youtubeVideoId` per court once the unlisted YouTube live events exist. The grid auto-adapts to the number of entries.
- `src/lib/firebase/demoMatches.ts` ships a static QF demo (real NLR squads + player surnames, all 0-0) shown as fallback when no Firebase activity. Constant `USE_LIVE_FIREBASE = false` keeps the demo always-on because other federations write to the shared match-N RTDB nodes. **Before 2026-06-06, flip to `true`** (or replace `hasLiveActivity` with a `tournament_name === "<NLR value>"` check once Robin confirms what the NLR pedals will write).
- `src/components/live/ScoreboardBar.tsx` is the shared 3-line scoreboard (court+phase / surnames+score+sets / squads+encounter). Used by both `LiveTile` (grid) and `MiniTile` (focus bottom row).

## Cost discipline (non-negotiable)

The platform must stay **free for NGBs** to justify existing instead of PlayerZone. Louis is fronting the infra cost from his pocket. Hard ceilings: ~50 $/month at 20-NGB steady state, <100 $/month even during a Worlds-scale peak. If you ever push a change that could break these, flag it explicitly and propose a mitigation.

**Rules to enforce on every PR touching public pages, media, or realtime:**

1. **Media never on Supabase Storage.** Photos, videos, replays → Cloudflare R2 or Bunny CDN. Supabase egress (0,09 $/GB above 250GB) is the biggest cost trap.
2. **Public pages (bracket, schedule, players, squads) must be cached.** Use Next.js ISR (`export const revalidate = 60` or similar) or a CDN. A spectator pageview should not hit Supabase on every load.
3. **Realtime is admin-only.** Squad admins and super admins subscribe. Spectators poll (10s) or use SSE via edge. Concurrent Realtime connections are the second-biggest driver.
4. **Heavy stats (palmarès, cross-tournament rankings) = materialized views + nightly refresh**, not live queries.
5. **No idle preview/branching envs.** Supabase Branching is 0,32 $/day each. Tear down or use local dev.
6. **Search at scale → Meilisearch on Railway (~5 $/mo)**, not `LIKE` on Postgres.

**Audit trigger:** if the monthly Supabase bill trends past 100 $/mo, stop and audit before paying. Usually it is an uncached page, media on Supabase Storage, or a runaway Realtime subscription.

**Escape hatches** (if pricing changes or we get stuck): Plan B = self-host Postgres on Hetzner + PostgREST (~30-50 €/mo + ops burden). Plan C = full OSS stack (Pocketbase / Appwrite on Coolify). Do not improvise these under pressure: keep the migration path documented.
