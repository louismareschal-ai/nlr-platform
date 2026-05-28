"use client";

import { useEffect, useState } from "react";
import { subscribeToMatch, type MatchSnapshot } from "./scoreboard";
import { COURTS } from "./courts";

export type CourtSnapshot = {
  court: number;
  matchId: string;
  snapshot: MatchSnapshot | null;
};

export function useAllMatches(): CourtSnapshot[] {
  const [snapshots, setSnapshots] = useState<Record<string, MatchSnapshot | null>>({});

  useEffect(() => {
    const unsubs = COURTS.map(({ matchId }) =>
      subscribeToMatch(matchId, (snap) => {
        setSnapshots((prev) => ({ ...prev, [matchId]: snap }));
      }),
    );
    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  return COURTS.map(({ court, matchId }) => ({
    court,
    matchId,
    snapshot: snapshots[matchId] ?? null,
  }));
}
