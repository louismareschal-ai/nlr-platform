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

## Project Structure

```
src/
├── app/
│   ├── login/            Login page
│   ├── change-password/  Forced first-login password change
│   ├── super-admin/      Super admin dashboard and tools
│   ├── squad-admin/      Squad admin: composition, scores, players
│   ├── player/           Player read-only view: schedule, bracket
│   ├── page.tsx          Root redirect based on role
│   ├── layout.tsx        Root layout (fonts, metadata)
│   └── globals.css       Tailwind v4 theme tokens
├── components/
│   ├── bracket/          BracketView — visual bracket display
│   ├── composition/      CompositionForm — squad composition submission
│   ├── layout/           AppShell — top nav, mobile nav
│   ├── scoring/          ScoreEntry — score entry + confirmation flow
│   └── ui/               Button, Card, Badge, Input
├── lib/
│   ├── supabase/         client.ts (browser), server.ts (SSR)
│   └── tournament/       bracket.ts — scoring logic, validation, bracket paths
├── middleware.ts          Auth guard + role-based redirects
└── types/index.ts         All TypeScript types
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

- `super_admin` → `/super-admin/*`
- `squad_admin` → `/squad-admin/*`
- `player` → `/player/*`

Middleware enforces role routing. First-login forced password change is enforced in middleware for non-super-admin users.

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
- `main` will be auto-deployed on Railway
