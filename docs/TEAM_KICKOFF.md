# Team Kickoff: NLR, Worlds, and the Platform

_Drafted 2026-05-22. Owner: Louis. Edit freely as a team._

This doc is the single source of truth for **how the three of us work together** in the same repo. Louis (NLR sprint), Alexandre (Worlds platform), Amely (cahier des charges + UI). It is not the product spec, it is the operating manual.

---

## The shared vision

Build **one platform** that hosts roundnet tournaments **for free** for National Governing Bodies (NGBs) and federations. That free-for-NGB promise is the reason this exists instead of PlayerZone. Infra discipline is non-negotiable, see `CLAUDE.md` section "Cost discipline".

Three horizons:

| Horizon | Owner | Deadline | Status |
|---|---|---|---|
| **NLR 2026** (8 squads, Mannheim) | Louis | June 6, 2026 | sprint mode, ~15 days left |
| **Worlds 2026 Paris** (~700 athletes) | Alexandre + Amely | September 2026 | starts next week |
| **Multi-NGB platform** (20+ federations) | everyone | 2027+ | architectural groundwork along the way |

---

## Core simplification (Louis's call, 2026-05-22)

**One account = one potential player.** No separate `athlete_profile` concept. Every user who signs up has a profile that accumulates their tournament history. Simpler model, fewer tables, fewer joins.

Implication: the existing `athlete_profiles` table (migration 003) was a parallel structure for scraped data. We will fold its useful fields (country, club, photo, bio) **into `players`** or onto the auth user, and drop the rest. Alexandre and Louis decide together when this refactor happens (probably right after NLR June 6).

Until then: `athlete_profiles` stays read-only for the public players directory. Do not add new dependencies on it.

---

## Rules of cohabitation

These exist so Louis can sprint to June 6 without the Worlds work breaking under him, **and** so Alexandre and Amely can move fast without waiting on NLR.

1. **NLR sprint is sacred until June 6.** No breaking changes to the core (auth, bracket logic, encounter/game schema, tournament routes) until then. If Alexandre needs a core change for Worlds, he pings Louis async first (one line, not a meeting). The change either lands behind a flag, or waits.
2. **Louis owns NLR scope.** Anything NLR-specific (this specific tournament's pages, copy, fixtures, scripts) is Louis's call alone.
3. **Alexandre owns Worlds scope.** Anything Worlds-specific (new routes under `/worlds-2026/`, pool play logic, self-registration flow) is Alexandre's call alone.
4. **Amely owns UI.** Design system, components in `src/components/ui/`, layout rhythm, color tokens in `globals.css`. She can refactor visuals freely, as long as functional flows still pass E2E tests.
5. **No human PR review.** We do not have time for it. Each person uses an AI reviewer (Claude Code, Codex, or whatever they prefer) on their own branch before merging. The AI must check: tests pass, no banned words (see `CLAUDE.md`), no breaking changes to other scopes, cost-discipline rules respected.
6. **Touching shared code = ping the other owner async** (one line message). Not a review, a heads-up. The other owner can object within 24h, otherwise it ships.
7. **`main` is auto-deployed.** Never commit directly. Always feature branch + merge. Already enforced in `CLAUDE.md`.
8. **Feature branches die fast.** Target merge within 3-5 days. No 3-month-long `feature/worlds` branch. Break big features into small mergeable slices behind a flag.

---

## Branch and PR conventions

```
feat/nlr-<thing>            Louis, NLR-specific
feat/worlds-<thing>         Alexandre, Worlds-specific
feat/core-<thing>           anything that affects both, cross-review required
feat/ui-<thing>             Amely, visual or design system work
fix/<thing>, docs/<thing>, chore/<thing>   anyone
```

PR title format: conventional commits (`feat:`, `fix:`, `docs:`, etc.).
PR body must say: **scope (NLR / Worlds / Core / UI)**, **risk to other scopes**, **how to test**.

---

## Specs (where they live, who writes them)

All specs live in `docs/specs/`, versioned in the repo. Markdown. No Notion, no Figma-as-source-of-truth (Figma is fine for visuals, but the spec text is here).

| File | Owner | Purpose |
|---|---|---|
| `docs/specs/platform-core.md` | Alexandre + Louis | shared vocabulary, data model, what is core vs feature-specific |
| `docs/specs/nlr-2026.md` | Louis | what NLR needs that goes beyond core |
| `docs/specs/worlds-2026.md` | Alexandre + Amely | Worlds format, registration, payment, categories, languages |
| `docs/specs/design-system.md` | Amely | tokens, components, principles, accessibility |
| `docs/tournament-format.md` | Louis | NLR tournament rules reference (already exists) |

Specs are **living docs**. Update them when you change the code, not before, not after, *with* the PR.

---

## First-week action plan (week of 2026-05-26)

No long kickoff meeting. Each person writes their cahier des charges in their corner first, then we do **one short call together (30-45 min)** to align. Pick the moment that works (before or after writing), the doc is more important than the meeting.

### Async warmup (everyone, before the call)

1. Read this doc fully.
2. Read `CLAUDE.md` at the repo root.
3. Read your spec stub in `docs/specs/`:
   - Louis → `docs/specs/nlr-2026.md` (to be written by Louis, short, NLR-only what is left to do)
   - Alexandre → `docs/specs/worlds-2026.md` (stub exists with questions)
   - Amely → `docs/specs/design-system.md` (stub exists with questions)
   - Everyone → `docs/specs/platform-core.md` (stub exists with questions, this is the convergence doc)
4. Answer the questions in your stub, in markdown, push as `feat/<scope>-spec-v1`.

### The short call (30-45 min, schedule when convenient)

- **Quick demo of the current app** (Louis, 10 min, can be on Louis's phone via `bash scripts/phone-access.sh`)
- **Walk through each person's spec draft** (15-20 min, decide what is locked vs open)
- **Triage the platform-core questions** (10 min, see Open questions below)

That is it. No second meeting unless something is truly blocked. Async wins.

### First week deliverables (target Friday 2026-05-29)

**Louis (NLR sprint, almost 100% focus)**
- Test My Squad flow end-to-end (composition + score entry as squad admin)
- Test Manage tab end-to-end (encounter detail, player management)
- Set up the 4 missing squad admins (Paris Outlaws, Hamburg Kings, Vienna Wolves, Bordeaux Storm)
- Side-by-side realtime test (2 browsers)
- Write `docs/specs/nlr-2026.md`: just the NLR-specific punchlist, short, no architecture

**Alexandre (Worlds platform, ramp-up)**
- Read the codebase top to bottom, including `bracket.ts`, `middleware.ts`, server actions
- Fill in `docs/specs/platform-core.md` (answer the questions, propose entities, do not wait for Louis)
- Fill in `docs/specs/worlds-2026.md` (answer the questions, write the format hypothesis)
- Identify what NLR-specific code should be generalized vs left alone until June 6, list it in the spec
- Set up dev environment, create a `seed-worlds.mjs` script, no shared fixtures with NLR

**Amely (cahier des charges + UI)**
- Click through every flow as a user, note what is confusing
- Fill in `docs/specs/design-system.md` (answer the questions, document tokens + gaps)
- Sketch the spectator landing experience for both NLR and Worlds (Figma is fine, link in the spec)
- List the 3 highest-leverage UI improvements that do not touch business logic

---

## Open questions to triage during the call

These are the things to not let drift. Mark each one as **decide now / this week / before NLR / before Worlds / v2**. Most live in the spec stubs (`platform-core.md`, `worlds-2026.md`, `design-system.md`), this is the summary.

### Architecture
1. Multi-tenant: do we activate `organizations` for Worlds, or stay implicit until later?
2. Same database for NLR and Worlds, or separate test/staging Supabase project for Worlds dev?
3. Do we cache public pages with Next.js ISR now, or after NLR? (cost discipline, see `CLAUDE.md`)
4. Generic bracket engine vs NLR-specific `bracket.ts`: refactor before Worlds work, or alongside?

### Worlds product
5. Pool play + bracket, or pure bracket? How many categories (Open, Women, Mixed, Junior, Master)?
6. Self-registration flow: athlete signs up themself? With payment? Waitlist? Approval by NGB?
7. Languages: English only, or English + French + German for Worlds?
8. Payment: Stripe? Federation invoicing? Free entry?
9. Live spectator view: bracket-only, or with stats / livestream embed / commentator notes?

### Data model
10. Confirm: one account = one potential player, no separate `athlete_profile`. Migration plan?
11. How do players represent **playing for multiple federations** over their career?
12. Tournament points: stay as `mixed_points / open_points / women_points` per tournament, or move to athlete-wide rating?

### Process
13. Async-only or weekly sync call? (suggestion: async-only, optional 30 min Friday)
14. Who is the tiebreaker when Louis and Alexandre disagree on a shared change? (suggestion: whoever owns the closer deadline)
15. Communication channel: Slack? Discord? WhatsApp?
16. Which AI reviewer does each person use, and what is its checklist?

### NGB onboarding (v2 but worth flagging)
17. How does a new NGB get an account? Self-service, or Louis/Alexandre create manually?
18. Per-NGB branding (logo, colors, subdomain)?
19. Per-NGB email sender for invitations?

---

## What we do NOT do this week

To protect the sprint and the focus:
- No big refactor of `bracket.ts` (wait until after June 6)
- No Stripe integration (decide first if needed)
- No multi-language (decide first if needed)
- No new Supabase migration without both Louis and Alexandre signing off
- No design system rewrite (Amely documents first, refactors later)
- No deployment changes (Railway stays)

---

## Communication norms

- Default to written. Decisions in PRs or in this doc.
- If something blocks you for more than 2 hours, ping the relevant person, do not wait for the next sync.
- If a question would only be useful to one person, message direct. If it teaches anyone else, write it in the spec doc or as a PR comment.
- Disagree fast, decide together. Do not let a disagreement sit overnight if it blocks work.

---

## Where to look first

- `CLAUDE.md` (root): architecture overview, cost discipline rules, conventions
- `docs/tournament-format.md`: NLR rules
- `src/lib/tournament/bracket.ts`: scoring logic, 24 tests in `npm run test:logic`
- `supabase/migrations/`: schema
- `src/app/tournaments/[slug]/`: primary routes
- `e2e/`: Playwright tests

---

_Update this doc as the team's working agreements evolve. It is the contract between the three of us, and it should reflect reality, not aspiration._
