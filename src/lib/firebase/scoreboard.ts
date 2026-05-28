import { ref, onValue, off } from "firebase/database";
import { getScoreboardDb } from "./client";

export type TeamInfo = {
  name?: string;
  color?: string;
  player_1?: string;
  player_2?: string;
  player_1_name?: string;
  player_2_name?: string;
  player_1_image?: string;
  player_2_image?: string;
  player_1_club?: string;
  player_2_club?: string;
  player_1_club_logo?: string;
  player_2_club_logo?: string;
  player_names?: string;
};

export type SetScore = {
  team_a_score?: number;
  team_b_score?: number;
  starting_server?: string;
  starting_receiver?: string;
  starting_team?: string;
};

export type ServeIndicator = {
  team_a?: string;
  team_b?: string;
};

export type Match = {
  active_set?: number;
  phase?: string;
  format?: string;
  tournament_name?: string;
  tournament_logo?: string;
  serve_indicator?: ServeIndicator;
  teams_info?: { team_a?: TeamInfo; team_b?: TeamInfo };
  score?: Record<string, SetScore>;
  game_settings?: { hardcap?: string; set_mode?: string; win_points?: string };
};

export type MatchSnapshot = {
  match: Match | null;
  setsWon: { teamA: number; teamB: number };
  currentSet: SetScore | null;
  activeSetIndex: number;
};

function computeSetsWon(match: Match): { teamA: number; teamB: number } {
  const winPoints = parseInt(match.game_settings?.win_points ?? "15", 10);
  const hardcap = parseInt(match.game_settings?.hardcap ?? "21", 10);
  let teamA = 0;
  let teamB = 0;
  const sets = match.score ?? {};
  const keys = Object.keys(sets).sort();
  for (const key of keys) {
    const s = sets[key];
    const a = s.team_a_score ?? 0;
    const b = s.team_b_score ?? 0;
    if (a < winPoints && b < winPoints) continue;
    if (a >= hardcap && b < a) {
      teamA++;
      continue;
    }
    if (b >= hardcap && a < b) {
      teamB++;
      continue;
    }
    if (a >= winPoints && a - b >= 2) {
      teamA++;
      continue;
    }
    if (b >= winPoints && b - a >= 2) {
      teamB++;
      continue;
    }
  }
  return { teamA, teamB };
}

export function snapshotFromMatch(match: Match | null): MatchSnapshot {
  if (!match) {
    return { match: null, setsWon: { teamA: 0, teamB: 0 }, currentSet: null, activeSetIndex: 1 };
  }
  const activeSetIndex = match.active_set ?? 1;
  const currentSet = match.score?.[`set_${activeSetIndex}`] ?? null;
  const setsWon = computeSetsWon(match);
  return { match, setsWon, currentSet, activeSetIndex };
}

export function subscribeToMatch(
  matchId: string,
  onUpdate: (snapshot: MatchSnapshot) => void,
): () => void {
  const db = getScoreboardDb();
  const matchRef = ref(db, matchId);
  const listener = onValue(matchRef, (snap) => {
    const match = (snap.val() as Match | null) ?? null;
    onUpdate(snapshotFromMatch(match));
  });
  return () => off(matchRef, "value", listener);
}
