import type { BracketSlot, GameType } from "@/types";

// For 8 squads: defines the quarterfinal seeding matchups
export const QF_SEEDS: Record<BracketSlot, [number, number]> = {
  qf_a: [1, 8],
  qf_b: [4, 5],
  qf_c: [2, 7],
  qf_d: [3, 6],
  // Later round slots don't have fixed seeds
  sf_winners_1: [0, 0],
  sf_winners_2: [0, 0],
  sf_placement_1: [0, 0],
  sf_placement_2: [0, 0],
  final: [0, 0],
  third_place: [0, 0],
  fifth_place: [0, 0],
  seventh_place: [0, 0],
};

// Where the winner and loser of each slot go in the next round
export const BRACKET_PATHS: Record<
  BracketSlot,
  { winner_to: BracketSlot | null; loser_to: BracketSlot | null }
> = {
  qf_a:            { winner_to: "sf_winners_1",   loser_to: "sf_placement_1" },
  qf_b:            { winner_to: "sf_winners_1",   loser_to: "sf_placement_1" },
  qf_c:            { winner_to: "sf_winners_2",   loser_to: "sf_placement_2" },
  qf_d:            { winner_to: "sf_winners_2",   loser_to: "sf_placement_2" },
  sf_winners_1:    { winner_to: "final",           loser_to: "third_place" },
  sf_winners_2:    { winner_to: "final",           loser_to: "third_place" },
  sf_placement_1:  { winner_to: "fifth_place",     loser_to: "seventh_place" },
  sf_placement_2:  { winner_to: "fifth_place",     loser_to: "seventh_place" },
  final:           { winner_to: null,              loser_to: null },
  third_place:     { winner_to: null,              loser_to: null },
  fifth_place:     { winner_to: null,              loser_to: null },
  seventh_place:   { winner_to: null,              loser_to: null },
};

// Human-readable bracket slot labels
export const BRACKET_LABELS: Record<BracketSlot, string> = {
  qf_a:            "Quarterfinal A",
  qf_b:            "Quarterfinal B",
  qf_c:            "Quarterfinal C",
  qf_d:            "Quarterfinal D",
  sf_winners_1:    "Semifinal 1",
  sf_winners_2:    "Semifinal 2",
  sf_placement_1:  "5th–8th Semifinal 1",
  sf_placement_2:  "5th–8th Semifinal 2",
  final:           "Grand Final",
  third_place:     "3rd Place",
  fifth_place:     "5th Place",
  seventh_place:   "7th Place",
};

// Encounter round for each game type: 1 = mixed round, 2 = open/women round
export const GAME_ENCOUNTER_ROUND: Record<GameType, 1 | 2> = {
  mixed1: 1,
  mixed2: 1,
  open1:  2,
  open2:  2,
  women:  2,
};

export const GAME_LABELS: Record<GameType, string> = {
  mixed1: "Mixed 1",
  mixed2: "Mixed 2",
  open1:  "Open 1",
  open2:  "Open 2",
  women:  "Women",
};

// Which squad won a given set
export function setWinner(scoreA: number, scoreB: number): "a" | "b" | null {
  if (!isValidSetScore(scoreA, scoreB)) return null;
  if (scoreA > scoreB) return "a";
  return "b";
}

// Validate a set score according to tournament rules:
// - Games to 15, win by 2 (e.g. 15-13, 16-14 are valid; 16-15 is NOT)
// - Hard cap at 21: only 21-20 is valid above 15-all
export function isValidSetScore(a: number, b: number): boolean {
  if (a < 0 || b < 0) return false;

  const high = Math.max(a, b);
  const low = Math.min(a, b);
  const diff = high - low;

  if (high < 15) return false; // game not finished yet (caller shouldn't submit)
  if (high === 15) return diff >= 2; // 15-13 OK, 15-14 NOT
  if (high === 21) return low === 20; // only 21-20 is valid at hard cap
  if (high > 21) return false; // can't exceed 21

  // Between 15 and 21: still must win by 2
  return diff >= 2;
}

// Determine the winner of a BO3 game given its sets
export function gameWinner(
  sets: { score_a: number; score_b: number }[]
): "a" | "b" | null {
  let winsA = 0;
  let winsB = 0;
  for (const s of sets) {
    const w = setWinner(s.score_a, s.score_b);
    if (w === "a") winsA++;
    if (w === "b") winsB++;
  }
  if (winsA >= 2) return "a";
  if (winsB >= 2) return "b";
  return null;
}

// Determine the winner of an encounter (3 of 5 games)
export function encounterWinner(
  gameResults: Array<"a" | "b" | null>
): "a" | "b" | null {
  const winsA = gameResults.filter((r) => r === "a").length;
  const winsB = gameResults.filter((r) => r === "b").length;
  if (winsA >= 3) return "a";
  if (winsB >= 3) return "b";
  return null;
}

// Validate composition constraints:
// Mixed 1 pair total mixed_points >= Mixed 2 pair total
// Open 1 pair total open_points >= Open 2 pair total
export function validateCompositionPoints(params: {
  mixed1_man_mixed: number;
  mixed1_woman_mixed: number;
  mixed2_man_mixed: number;
  mixed2_woman_mixed: number;
  open1_p1_open: number;
  open1_p2_open: number;
  open2_p1_open: number;
  open2_p2_open: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const mixed1Total = params.mixed1_man_mixed + params.mixed1_woman_mixed;
  const mixed2Total = params.mixed2_man_mixed + params.mixed2_woman_mixed;
  if (mixed1Total < mixed2Total) {
    errors.push(
      `Mixed 1 (${mixed1Total} pts) must have more or equal mixed points than Mixed 2 (${mixed2Total} pts)`
    );
  }

  const open1Total = params.open1_p1_open + params.open1_p2_open;
  const open2Total = params.open2_p1_open + params.open2_p2_open;
  if (open1Total < open2Total) {
    errors.push(
      `Open 1 (${open1Total} pts) must have more or equal open points than Open 2 (${open2Total} pts)`
    );
  }

  return { valid: errors.length === 0, errors };
}
