# Platform Core Spec (draft)

_Draft by Louis, 2026-05-22. Owner: Alexandre + Louis. Convergence doc._

This is the **shared vocabulary** of the platform. Anything that NLR and Worlds both touch lives here. Fill in your answers under each question, push as `feat/core-spec-v1`, we converge during the call.

---

## North star

The platform must serve **any roundnet tournament**, hosted by **any NGB / federation / club**, **at zero cost to them**. Tomorrow Roundnet France, Spikeball Germany, and a small club in Lyon should all be able to run a tournament here without a contract or a credit card.

That means: **everything we build should be generic by default and NLR/Worlds-specific by exception**.

---

## Locked decisions

These are not up for debate, they were decided 2026-05-22 by Louis. Push back if you have a strong counter-argument, but the burden of proof is on you.

1. **One account = one potential player.** No separate `athlete_profile`. Every user who signs up has a profile that accumulates their tournament history. Country, club, photo, bio live on the user / player record itself.
2. **Free for NGBs.** No paywall, no per-tournament fee. Cost discipline rules in `CLAUDE.md` are non-negotiable.
3. **Same codebase, same deployment.** Not a fork, not a separate project. Worlds and NLR run on the same code, same database, same Railway deploy.
4. **No human PR review.** AI-reviewed only. Each person is responsible for their merge.
5. **NLR sprint is sacred until June 6.** No breaking changes to core schema, `bracket.ts`, `middleware.ts`, or tournament routes until then.

---

## Entities (proposed, please refine)

These are Louis's first cut. The naming might be wrong, the cardinality might be wrong. Alexandre, propose corrections.

| Entity | Purpose | Notes |
|---|---|---|
| **Account** | Auth identity (Supabase user). | Email + password. One per real person. |
| **Player** | The same person as a tournament participant. | 1:1 with Account (we are simplifying). Holds country, club, photo, bio, gender, points. |
| **Organization** | NGB, federation, club, or any tournament host. | Already exists as a table (migration 004). Currently unused, must be activated. |
| **Tournament** | A single competition event. | Belongs to one Organization. Has a format, a schedule, a list of participants. |
| **Format** | How a tournament is structured. | Single elim 8 squads (NLR), pool + bracket (Worlds), round robin, swiss, double elim. **This is the abstraction to get right.** |
| **Squad / Team** | A group of players competing together. | NLR has 6-player squads. Worlds might have different team sizes per category. |
| **Encounter** | A matchup between two squads/teams in a tournament. | Composed of multiple Games. |
| **Game** | One BO3 within an encounter. | Has set scores. |
| **Category** | A division within a tournament. | NLR has none (everyone plays one bracket). Worlds has Open / Women / Mixed (probably). |
| **Court** | Physical playing surface. | Used for scheduling games. |

### Questions for Alexandre

1. **Is the entity list complete?** What did I miss?
2. **Player vs Squad vs Team:** is "Squad" NLR-specific (6 players, fixed composition before tournament) and "Team" generic (any size, any composition)? Or are they the same thing with different sizes?
3. **Category:** is it a property of Tournament (one tournament has multiple categories) or its own first-class entity (each category is essentially a sub-tournament)?
4. **Format:** how do we represent it? An enum (`single_elim_8`, `pool_4x4_then_bracket`, etc.) or a structured config object? Generic engine or pluggable strategies?
5. **Athlete-wide rating vs per-tournament points:** today we have `mixed_points`, `open_points`, `women_points` set per-player per-tournament. Should rating be athlete-wide (lifetime) and tournaments just *import* it as a snapshot?
6. **Multi-NGB athletes:** what if a player competes for France in NLR but for the German club at Worlds? One Player or two? (suggestion: one Player, the "country/club for this tournament" is on the participation record, not on the Player)

---

## Multi-tenancy

The `organizations` table exists. Today nothing uses it. We must decide *when* to wire it in.

### Questions

1. Do we add `organization_id` (required) to every Tournament now, or after June 6?
2. RLS: when a user belongs to multiple organizations, how do we scope reads? (suggestion: tournaments are public-read, writes scoped by `organization_members`)
3. NGB onboarding flow: self-service signup (NGB creates account, claims a slug, starts a tournament), or manual (Louis/Alexandre create the org)?
4. Per-NGB branding: out of scope for v1, but how do we keep the door open architecturally?

---

## Bracket / Format engine

`src/lib/tournament/bracket.ts` today is hardcoded for **single elim 8 squads with all placement games**. `QF_SEEDS`, `BRACKET_PATHS`, encounter-of-5-games are NLR-specific assumptions.

### Questions

1. Do we refactor `bracket.ts` into a generic engine **before** Worlds work starts, or do we **dual-track** (NLR keeps `bracket.ts`, Worlds gets a new `bracket-pool.ts` or similar)?
2. If generic: what is the interface? A pure function `(tournament, current_results) => next_encounters`?
3. Score format: NLR is BO3 to 15. Worlds might use the same, or differ. Should score validation be a property of Format, not hardcoded?

---

## Realtime, caching, and cost discipline

These are not negotiable, see `CLAUDE.md` "Cost discipline". Just confirming we all read it:

- Public spectator pages (bracket, schedule, players) must be cached (ISR or CDN). No Supabase pageview per spectator.
- Realtime subscriptions are for admins only (super_admin, squad_admin). Spectators poll.
- Media (photos, videos) never on Supabase Storage. R2 or Bunny.

### Question

1. Is this clear, or does anything need to change for Worlds to work? (e.g., live commentary feeds)

---

## What to write back

Push a branch `feat/core-spec-v1` with this file edited:
- Answers under each "Questions" block (your name in italic next to your answer)
- Strikethrough on anything you think is wrong, with a rationale
- New questions you want raised in the call

Convergence happens during the call, not before.
