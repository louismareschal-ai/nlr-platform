# Worlds 2026 Paris Spec (draft)

_Draft stub by Louis, 2026-05-22. Owner: Alexandre + Amely._

This is **your** spec, Alexandre. Fill it in. The questions below are the ones I would want answered before writing a single line of Worlds code. Add, remove, reorder freely.

Target: September 2026, Paris, ~700 athletes.

---

## Format hypothesis (please confirm or correct)

My guess, no claim to authority:
- Multiple categories played in parallel: **Open** (men's doubles), **Women**, **Mixed**, maybe **Junior** and **Master**
- Each category: **pool play (group stage)** then **bracket (single or double elim)**
- Pools of 4-6 teams, top N from each pool qualify for bracket
- Match format: BO3, 15 pts, win by 2, hard cap 21 (same as NLR), unless WRF rules say otherwise

### Questions

1. **Categories:** confirm the list. Are Junior / Master in scope for v1?
2. **Pool structure:** pool size, number of pools, advancement rule (top 1, top 2, top half)?
3. **Bracket after pool:** single elim, double elim, or full placement (everyone plays the same number)?
4. **Tiebreakers in pool:** head-to-head, point differential, total points scored?
5. **Match format:** confirm BO3 to 15. Different at finals?
6. **Days:** 3 days? 4? Pool play day 1, bracket days 2-3?

---

## Registration and identity

This is the biggest delta from NLR. NLR has 8 hand-picked squads. Worlds has hundreds of athletes self-registering.

### Questions

1. **Who registers?** The athlete? The team captain on behalf of the team? The NGB on behalf of its delegation?
2. **Payment:** is there an entry fee? If yes: per-athlete, per-team, paid by NGB or by player? Stripe?
3. **Approval flow:** does someone validate registrations, or is it automatic?
4. **Cap:** is there a maximum number of teams per category? Waitlist behavior?
5. **Deadlines:** registration open / close dates?
6. **Team composition:** when is the team locked? Substitutions allowed?
7. **Verification:** do we need to verify identity (passport, federation membership)? How?

---

## Internationalization

NLR is German + French players, the UI is English-only. Worlds is global.

### Questions

1. **Languages:** English only is fine for Worlds, or do we need French + German at minimum?
2. **If multilingual:** `next-intl`? Translation source (community-contributed in YAML, professional translation)?
3. **Currency / locale:** if there is a payment, do we show EUR only or local?

---

## Spectator experience

Worlds is the biggest event in the sport. People who do not know what roundnet is will land on the bracket page during the finals.

### Questions

1. **Landing page:** custom for Worlds, or the same generic tournament page as NLR?
2. **Live scores:** how prominent? Embedded livestream?
3. **Player profiles:** do spectators care? What do we surface (career stats, tournament history, photo, country)?
4. **Public schedule:** by day, by court, by category?
5. **Mobile experience:** is the mobile spectator view the primary view? (probably yes)

---

## Scale and reliability

700 athletes + spectators + livestream audience = the first time we test the platform under load.

### Questions

1. **Concurrent spectators expected:** order of magnitude? 1K? 10K? 50K?
2. **Realtime subscriptions:** are we comfortable serving live bracket updates to 1K+ concurrent clients via Supabase? (cost discipline says: spectators poll, do not subscribe)
3. **Fallback if Supabase struggles:** do we have a static export of the bracket we can serve from CDN if things break?
4. **Backups during the event:** snapshot every hour?

---

## Out of scope for Worlds v1 (proposed)

To keep the deliverable realistic. Push back if you disagree.

- Per-NGB branding / white-labeling
- Multilingual UI (decide above)
- Stripe payments (decide above)
- Athlete chat / messaging
- Player photo upload UI (we scrape or curate)
- Live commentator console / dedicated stats input

---

## What to write back

Push a branch `feat/worlds-spec-v1` with this file edited:
- Answers under each "Questions" block
- New sections if you see gaps
- Tag anything ambiguous with `TBD` and a name (who decides)

Coordinate with Amely on the spectator + landing sections, those overlap with her design work.
