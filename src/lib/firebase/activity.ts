import type { Match } from "./scoreboard";

export function hasActivity(match: Match | null | undefined): boolean {
  if (!match) return false;
  if (match.teams_info?.team_a?.name || match.teams_info?.team_a?.player_names) return true;
  if (match.teams_info?.team_b?.name || match.teams_info?.team_b?.player_names) return true;
  const sets = match.score ?? {};
  for (const key of Object.keys(sets)) {
    if (key === "squad_score") continue;
    const s = sets[key];
    if ((s?.team_a_score ?? 0) > 0 || (s?.team_b_score ?? 0) > 0) return true;
  }
  return false;
}
