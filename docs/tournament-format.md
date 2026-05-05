# NLR Tournament Format — Reference

## Squad Composition

- 6 players per squad: 4 men (open) + 2 women
- Players have independent point ratings: **mixed_points**, **open_points**, **women_points**
- Points imported from playerzone before event; super admin can tweak before the event starts

## Encounter Structure

An **encounter** is a matchup between two squads. It has two rounds played on separate courts.

### Round 1 — Mixed (2 courts simultaneously)

| Game | Format | Players |
|---|---|---|
| Mixed 1 | BO3, 15 pts, hard cap 21 | 1 man + 1 woman per side |
| Mixed 2 | BO3, 15 pts, hard cap 21 | 1 man + 1 woman per side |

**Composition constraint:** sum of mixed_points for Mixed 1 pair ≥ sum for Mixed 2 pair.

### Round 2 — Open + Women (3 courts simultaneously)

| Game | Format | Players |
|---|---|---|
| Open 1 | BO3, 15 pts, hard cap 21 | 2 men per side |
| Open 2 | BO3, 15 pts, hard cap 21 | 2 men per side |
| Women | BO3, 15 pts, hard cap 21 | 2 women per side (same as Mixed) |

**Composition constraint:** sum of open_points for Open 1 pair ≥ sum for Open 2 pair.

### Encounter Result

The squad that wins **3 or more of the 5 games** wins the encounter.

## Score Validation Rules

- Games to 15, win by 2 (e.g. 15-13, 16-14, 17-15 are valid; 16-15 is NOT)
- Hard cap at 21: only 21-20 is valid above 15-all

## Pre-Encounter Composition Flow

1. Both squad admins independently submit their composition for the encounter
2. Composition includes: Mixed 1, Mixed 2, Open 1, Open 2 (Women is always both women)
3. Once BOTH squads have submitted, the app simultaneously reveals both compositions
4. If only one squad has submitted, they wait for the other

## Score Entry Flow

1. Either squad admin enters the score for a game
2. App notifies the other squad admin to confirm
3. Other squad admin either confirms (score is locked) or edits
4. If edited, first squad admin is notified to confirm the new score
5. Auto-validation rejects scores that break the rules above

## Bracket Format (8 squads)

Single elimination with all placement games — every team plays the same number of encounters.

### Round 1 — Quarterfinals
- Encounter A: Seed 1 vs Seed 8
- Encounter B: Seed 4 vs Seed 5
- Encounter C: Seed 2 vs Seed 7
- Encounter D: Seed 3 vs Seed 6

### Round 2 — Semifinals
- Winners bracket SF 1: W(A) vs W(B)
- Winners bracket SF 2: W(C) vs W(D)
- Placement SF 1 (5th-8th): L(A) vs L(B)
- Placement SF 2 (5th-8th): L(C) vs L(D)

### Round 3 — Finals
- Grand Final: W(SF1) vs W(SF2) → 1st / 2nd place
- 3rd place: L(SF1) vs L(SF2)
- 5th place: W(Placement SF1) vs W(Placement SF2)
- 7th place: L(Placement SF1) vs L(Placement SF2)

All 8 teams play exactly 3 encounters.

## Court Assignment

- 12 courts available
- Court assignment is done in advance by the super admin
- Each game within an encounter is assigned a specific court

## Schedule

- Fixed time schedule set by super admin before the event
- Super admin can adjust scheduled times during the day
- Players see their schedule in real time

## User Roles

| Role | Permissions |
|---|---|
| super_admin | Full access: manage tournaments, assign courts, adjust schedule, tweak player points, see all dashboards |
| squad_admin | Submit composition, enter/confirm scores, see squad schedule |
| player | Read-only: see schedule, bracket, court assignments |

## Warm-Up Round

- Exists before the official tournament
- Does not count toward standings
- Details TBD — squad matches but results not recorded in bracket
