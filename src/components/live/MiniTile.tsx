"use client";

import Link from "next/link";
import type { MatchSnapshot } from "@/lib/firebase/scoreboard";
import ScoreboardBar from "./ScoreboardBar";

type Props = {
  court: number;
  snapshot: MatchSnapshot | null;
};

export default function MiniTile({ court, snapshot }: Props) {
  return (
    <Link
      href={`/live/court/${court}`}
      className="relative block overflow-hidden no-underline transition-colors"
      style={{
        background: "#0a0a14",
        border: "1px solid rgba(232,184,75,0.16)",
      }}
    >
      <ScoreboardBar court={court} snapshot={snapshot} />
    </Link>
  );
}
