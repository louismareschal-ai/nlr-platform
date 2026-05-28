"use client";

import { useAllMatches } from "@/lib/firebase/useAllMatches";
import { hasActivity } from "@/lib/firebase/activity";
import { STREAMS } from "@/lib/firebase/streams";
import LiveTile from "./LiveTile";

export default function LiveGrid() {
  const all = useAllMatches();
  const activeCount = all.filter((c) => hasActivity(c.snapshot?.match)).length;

  const ROUND_1_THRESHOLD = 8;
  const useRound1Layout = activeCount > 0 && activeCount <= ROUND_1_THRESHOLD;

  const tilesToShow = useRound1Layout
    ? all.filter((c) => hasActivity(c.snapshot?.match))
    : all;

  const cols = useRound1Layout ? 4 : 4;
  const rows = useRound1Layout ? 2 : 3;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
        gap: "2px",
        background: "#000",
      }}
    >
      {tilesToShow.map((c) => {
        const stream = STREAMS.find((s) => s.court === c.court);
        return (
          <LiveTile
            key={c.court}
            court={c.court}
            youtubeVideoId={stream?.youtubeVideoId ?? null}
            snapshot={c.snapshot}
          />
        );
      })}
    </div>
  );
}
