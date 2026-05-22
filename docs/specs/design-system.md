# Design System Spec (draft)

_Draft stub by Louis, 2026-05-22. Owner: Amely._

Hi Amely, this is your starting point. The questions below are what I would want you to think through before touching the UI. Add, remove, reorder freely. You are the UI owner from day one.

---

## What exists today

The app is built with **Tailwind CSS v4** (CSS-first, no `tailwind.config.js`). All design tokens are CSS variables in `src/app/globals.css` under `@theme {}`.

### Current tokens

```css
--color-void:   #050508   /* page background, near-black */
--color-gold:   #e8b84b   /* accent, CTAs, highlights */
--color-chalk:  #f0ece3   /* primary text */
--color-muted:  #6b6b7a   /* secondary text */
--color-border: #1a1a24   /* card borders, separators */
```

Aesthetic intent: dark, premium, gold accent, "championship" feel. Like a Formula 1 broadcast graphic, not a corporate SaaS.

### Current components

In `src/components/ui/`:
- `Button` (variants TBD by Amely)
- `Card`
- `Badge`
- `Input`

Layout components in `src/components/layout/`:
- `SiteShell` (top nav, sign-in/out)
- `TournamentSubNav` (role-adaptive tabs under a tournament)

Domain components (touch business logic, less freedom to redesign without coordination):
- `BracketView`, `BracketWithPanel`, `EncounterPanel` in `src/components/bracket/`
- `CompositionForm` in `src/components/composition/`
- `ScoreEntry` in `src/components/scoring/`

### Pages worth clicking through (in order)

1. `/login`
2. `/tournaments` (list)
3. `/tournaments/test/bracket` (the main view, click on a card to open the panel)
4. `/tournaments/test/schedule`
5. `/tournaments/test/squads`
6. `/tournaments/test/my-squad` (need to be logged in as squad admin)
7. `/tournaments/test/manage` (need to be logged in as super admin)
8. `/players`, `/players/[id]`

To run locally: `npm run dev` then open `localhost:3010`.

To get phone access: `bash scripts/phone-access.sh` while dev server is running.

---

## Questions for Amely

### Discovery

1. After clicking through every page, what feels **broken or inconsistent**? List concrete examples.
2. What feels **right** and we should preserve? (so we do not redesign for the sake of redesigning)
3. Which **3 UI improvements** would have the biggest impact on user experience without touching business logic?

### Design system foundations

4. Are the **5 color tokens** enough, or do we need success / warning / error / info colors as semantic tokens?
5. Do we need a **typography scale** documented (h1-h6, body, caption, micro)? What font sizes and weights?
6. Do we need a **spacing scale** beyond Tailwind defaults?
7. Do we have **dark mode only**, or should we add a light theme? (probably dark only, but please confirm)
8. **Accessibility:** is contrast OK on the gold (#e8b84b) vs void (#050508)? Are focus states visible enough?

### Components

9. `Button`: how many variants do we need? (primary, secondary, ghost, destructive, link?). Sizes? Loading state?
10. `Card`: do we have one card style, or variants (interactive, static, highlight)?
11. `Badge`: status colors (live, completed, pending)?
12. `Input`: error states, helper text, prefix/suffix icons?
13. What components are **missing** that we use ad-hoc with Tailwind classes everywhere? (modal, tooltip, dropdown, table, etc.)

### Spectator experience

This is currently weak across both NLR and Worlds. Spectators land on `/tournaments/[slug]/bracket` and that is it. There is no landing page, no story.

14. What should the **NLR tournament landing page** look like? Who is the audience (German + French players, families)?
15. What should the **Worlds tournament landing page** look like? Who is the audience (international, broader public, first-time roundnet viewers)?
16. **One landing page template** with per-tournament content, or two distinct templates?
17. Should the bracket be the default tab, or should the landing precede it?

### Cahier des charges (broader UX)

18. What **user journeys** do we need to map first? (e.g., "I am a player and I want to know when I play next", "I am a spectator and I want to know who is winning")
19. Are there **pain points** in the current flow that you notice as a fresh user?
20. **Mobile-first or desktop-first?** Squad admins use phones during tournaments, spectators use phones, super admins probably desktop. Default to mobile-first?

### Tooling

21. Will you work in **Figma**? Other tool? Where do mockups live?
22. Do you want to **touch code directly** (Tailwind classes, component edits) or do you prefer to hand mockups to Alexandre/Louis?
23. Are you comfortable using **Claude Code** or another AI to translate mockups to code yourself?

---

## What to write back

Push a branch `feat/ui-spec-v1` with this file edited:
- Answers under each "Questions" block
- Concrete examples (screenshots, links, sketches) where relevant
- A **3-step roadmap** of what you would do in the first month, ordered by impact

Coordinate with Alexandre on the spectator + landing sections, those overlap with his Worlds spec.

Welcome on board.
