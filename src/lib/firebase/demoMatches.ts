import type { CourtSnapshot } from "./useAllMatches";
import type { MatchSnapshot } from "./scoreboard";

// Static fallback data shown on /live when Firebase has no activity yet.
// Quarterfinals only, all 0-0. Real NLR 2026 squads + player surnames.
// QF1 + QF2 in Round 1 (Mixed, 2 games per encounter), QF3 + QF4 in
// Round 2 streaming only the Women game. No player appears on two
// courts simultaneously. Real Firebase activity (pedal scoreboards on
// June 6) replaces each court's snapshot via `mergeWithDemo` below.
//
// Convention: team.name = squad label, team.player_names = surnames of
// the two players on the court for this game.

export const DEMO_MATCHES: CourtSnapshot[] = [
  {
    court: 1,
    matchId: "match-6",
    snapshot: {
      match: {
        active_set: 1,
        phase: "QF1 · Mixed",
        teams_info: {
          team_a: { name: "Squad 1", player_names: "Mezzetti / Ernestsone" },
          team_b: { name: "Squad 8", player_names: "Schirop / Walter" },
        },
        score: {
          set_1: { team_a_score: 0, team_b_score: 0 },
          squad_score: { team_a_score: 0, team_b_score: 0 },
        },
        game_settings: { win_points: "15", hardcap: "21" },
      },
      setsWon: { teamA: 0, teamB: 0 },
      currentSet: { team_a_score: 0, team_b_score: 0 },
      activeSetIndex: 1,
    },
  },
  {
    court: 2,
    matchId: "match-7",
    snapshot: {
      match: {
        active_set: 1,
        phase: "QF1 · Mixed",
        teams_info: {
          team_a: { name: "Squad 1", player_names: "Lauterbach / Rossetto" },
          team_b: { name: "Squad 8", player_names: "Christiani / Bauer" },
        },
        score: {
          set_1: { team_a_score: 0, team_b_score: 0 },
          squad_score: { team_a_score: 0, team_b_score: 0 },
        },
        game_settings: { win_points: "15", hardcap: "21" },
      },
      setsWon: { teamA: 0, teamB: 0 },
      currentSet: { team_a_score: 0, team_b_score: 0 },
      activeSetIndex: 1,
    },
  },
  {
    court: 3,
    matchId: "match-8",
    snapshot: {
      match: {
        active_set: 1,
        phase: "QF2 · Mixed",
        teams_info: {
          team_a: { name: "Squad 2", player_names: "Juska / Wiedmer" },
          team_b: { name: "Squad 7", player_names: "Eigenmann / Gassner" },
        },
        score: {
          set_1: { team_a_score: 0, team_b_score: 0 },
          squad_score: { team_a_score: 0, team_b_score: 0 },
        },
        game_settings: { win_points: "15", hardcap: "21" },
      },
      setsWon: { teamA: 0, teamB: 0 },
      currentSet: { team_a_score: 0, team_b_score: 0 },
      activeSetIndex: 1,
    },
  },
  {
    court: 4,
    matchId: "match-9",
    snapshot: {
      match: {
        active_set: 1,
        phase: "QF2 · Mixed",
        teams_info: {
          team_a: { name: "Squad 2", player_names: "Colliva / Amsler" },
          team_b: { name: "Squad 7", player_names: "Tarnutzer / Salvador" },
        },
        score: {
          set_1: { team_a_score: 0, team_b_score: 0 },
          squad_score: { team_a_score: 0, team_b_score: 0 },
        },
        game_settings: { win_points: "15", hardcap: "21" },
      },
      setsWon: { teamA: 0, teamB: 0 },
      currentSet: { team_a_score: 0, team_b_score: 0 },
      activeSetIndex: 1,
    },
  },
  {
    court: 5,
    matchId: "match-10",
    snapshot: {
      match: {
        active_set: 1,
        phase: "QF3 · Women",
        teams_info: {
          team_a: { name: "Squad 3", player_names: "Meijer / Barschke" },
          team_b: { name: "Squad 6", player_names: "Joly / Kunzelmann" },
        },
        score: {
          set_1: { team_a_score: 0, team_b_score: 0 },
          squad_score: { team_a_score: 0, team_b_score: 0 },
        },
        game_settings: { win_points: "15", hardcap: "21" },
      },
      setsWon: { teamA: 0, teamB: 0 },
      currentSet: { team_a_score: 0, team_b_score: 0 },
      activeSetIndex: 1,
    },
  },
  {
    court: 6,
    matchId: "match-11",
    snapshot: {
      match: {
        active_set: 1,
        phase: "QF4 · Women",
        teams_info: {
          team_a: { name: "Squad 4", player_names: "Haas / Kühner" },
          team_b: { name: "Squad 5", player_names: "Günther / Lorenz" },
        },
        score: {
          set_1: { team_a_score: 0, team_b_score: 0 },
          squad_score: { team_a_score: 0, team_b_score: 0 },
        },
        game_settings: { win_points: "15", hardcap: "21" },
      },
      setsWon: { teamA: 0, teamB: 0 },
      currentSet: { team_a_score: 0, team_b_score: 0 },
      activeSetIndex: 1,
    },
  },
];

// TODO before NLR 2026-06-06: flip USE_LIVE_FIREBASE to true (or filter by
// tournament_name once Roundnet Germany confirms the value their pedals
// will write). The match-N nodes are shared across federations: other
// tournaments are currently writing Germany/France/etc data to match-6..,
// which would clobber the demo display on the client.
const USE_LIVE_FIREBASE = false;

function hasLiveActivity(snapshot: MatchSnapshot | null): boolean {
  if (!USE_LIVE_FIREBASE) return false;
  if (!snapshot?.match) return false;
  return Boolean(snapshot.match.teams_info?.team_a || snapshot.match.teams_info?.team_b);
}

// Returns the live snapshot if Firebase has data for the court, otherwise
// the static demo snapshot. Lets the page look ready ahead of the event
// and seamlessly switch to live data once pedal scoreboards activate.
export function mergeWithDemo(live: CourtSnapshot[]): CourtSnapshot[] {
  return live.map((c) => {
    if (hasLiveActivity(c.snapshot)) return c;
    const demo = DEMO_MATCHES.find((d) => d.court === c.court);
    return demo ?? c;
  });
}
