import courtsConfig from "../../../data/courts.json";

export type CourtMapping = { court: number; matchId: string };

export const COURTS: CourtMapping[] = courtsConfig.courts;

export function matchIdForCourt(court: number): string | null {
  return COURTS.find((c) => c.court === court)?.matchId ?? null;
}

export function courtForMatchId(matchId: string): number | null {
  return COURTS.find((c) => c.matchId === matchId)?.court ?? null;
}
