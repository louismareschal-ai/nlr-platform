"use client";

import { useAllMatches } from "@/lib/firebase/useAllMatches";
import { mergeWithDemo } from "@/lib/firebase/demoMatches";
import { STREAMS } from "@/lib/firebase/streams";
import LiveTile from "./LiveTile";

function gridClasses(count: number): string {
  if (count <= 1) return "grid-cols-1 grid-rows-1";
  if (count <= 2) return "grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1";
  if (count <= 3) return "grid-cols-1 grid-rows-3 md:grid-cols-3 md:grid-rows-1";
  if (count <= 4) return "grid-cols-2 grid-rows-2";
  if (count <= 6) return "grid-cols-2 grid-rows-3 md:grid-cols-3 md:grid-rows-2";
  if (count <= 9) return "grid-cols-3 grid-rows-3";
  return "grid-cols-3 grid-rows-4 md:grid-cols-4 md:grid-rows-3";
}

export default function LiveGrid() {
  const live = useAllMatches();
  const all = mergeWithDemo(live);

  const streamCourtSet = new Set(STREAMS.map((s) => s.court));
  const tilesToShow = all.filter((c) => streamCourtSet.has(c.court));

  return (
    <div
      className={`fixed inset-0 grid gap-[2px] bg-black ${gridClasses(tilesToShow.length)}`}
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
