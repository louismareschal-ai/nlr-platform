# NLR Platform — CLAUDE.md

Tournament management app for Next Level Roundnet. First use case: NLR 2026 (8 squads, June 2026, Mannheim). End goal: Worlds 2026 Paris (700 athletes, September 2026).

See `docs/tournament-format.md` for the full tournament rules and format.

## Commands

```bash
npm run dev      # Dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

Requires **Node 20+**.

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

## Branch rules

- Never commit to `main` directly
- Branch: `feature/<name>` → PR → merge to `main`
- `main` will be auto-deployed on Railway
