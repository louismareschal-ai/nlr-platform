"use client";

import Link from "next/link";
import type { MatchSnapshot } from "@/lib/firebase/scoreboard";
import ScoreboardBar from "./ScoreboardBar";

type Props = {
  court: number;
  youtubeVideoId: string | null;
  snapshot: MatchSnapshot | null;
};

export default function LiveTile({ court, youtubeVideoId, snapshot }: Props) {
  const embedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1`
    : null;

  return (
    <Link
      href={`/live/court/${court}`}
      className="relative block bg-[#05050a] overflow-hidden text-[#f0ece3] no-underline border border-[#e8b84b2e]"
    >
      {embedUrl ? (
        <iframe
          src={embedUrl}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-none pointer-events-none"
          title={`Court ${court}`}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-[#6b6b7a] uppercase"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(31,111,235,0.18), transparent 60%), radial-gradient(circle at 70% 70%, rgba(255,122,0,0.16), transparent 60%), #0a0a14",
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "clamp(0.6rem, 2vw, 1rem)",
            letterSpacing: "0.2em",
          }}
        >
          Stream offline
        </div>
      )}

      <ScoreboardBar court={court} snapshot={snapshot} />

      <img
        src="/nlr-logo.svg"
        alt=""
        aria-hidden
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          padding: "clamp(0.35rem, 1.4vw, 0.6rem) clamp(0.4rem, 1.6vw, 0.7rem)",
          height: "clamp(1.2rem, 4vw, 2rem)",
          width: "auto",
          opacity: 0.7,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
        }}
      />
    </Link>
  );
}
