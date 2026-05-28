"use client";

import Link from "next/link";
import { useAllMatches } from "@/lib/firebase/useAllMatches";
import { mergeWithDemo } from "@/lib/firebase/demoMatches";
import { STREAMS, streamForCourt } from "@/lib/firebase/streams";
import { matchIdForCourt } from "@/lib/firebase/courts";
import LiveTile from "./LiveTile";
import ScoreboardBar from "./ScoreboardBar";

export default function FocusView({ court }: { court: number }) {
  const live = useAllMatches();
  const all = mergeWithDemo(live);

  const main = all.find((c) => c.court === court);
  const streamCourtSet = new Set(STREAMS.map((s) => s.court));
  const others = all.filter(
    (c) => c.court !== court && streamCourtSet.has(c.court)
  );

  const matchId = matchIdForCourt(court);
  const stream = streamForCourt(court);
  const youtubeVideoId = stream?.youtubeVideoId ?? null;

  const embedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1`
    : null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        gridTemplateRows: "1fr auto",
        background: "#000",
        color: "#f0ece3",
        fontFamily: "var(--font-display), 'Barlow Condensed', sans-serif",
      }}
    >
      <div style={{ position: "relative", overflow: "hidden" }}>
        {embedUrl ? (
          <iframe
            key={matchId}
            src={embedUrl}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
            title={`Court ${court}`}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at 30% 30%, rgba(31,111,235,0.18), transparent 60%), radial-gradient(circle at 70% 70%, rgba(255,122,0,0.18), transparent 60%), #0a0a14",
              color: "#6b6b7a",
              fontSize: "2rem",
              letterSpacing: "0.25em",
              textTransform: "uppercase",
            }}
          >
            Stream offline
          </div>
        )}

        <ScoreboardBar court={court} snapshot={main?.snapshot ?? null} />

        <Link
          href="/live"
          className="absolute pointer-events-auto"
          style={{
            top: "clamp(0.5rem, 1.5vh, 1rem)",
            left: "clamp(0.5rem, 1.5vw, 1rem)",
            padding: "clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 1.6vw, 1rem)",
            background: "rgba(5,5,8,0.78)",
            backdropFilter: "blur(4px)",
            borderRadius: "8px",
            border: "1px solid rgba(232,184,75,0.3)",
            color: "#e8b84b",
            textDecoration: "none",
            fontSize: "clamp(0.6rem, 2vw, 0.95rem)",
            letterSpacing: "0.18em",
            fontWeight: 700,
            zIndex: 2,
          }}
        >
          ← ALL COURTS
        </Link>

        <img
          src="/nlr-logo.svg"
          alt=""
          aria-hidden
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            padding: "clamp(0.5rem, 1.5vw, 1rem)",
            height: "clamp(1.6rem, 5vw, 3rem)",
            width: "auto",
            opacity: 0.7,
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
          }}
        />
      </div>

      {others.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${others.length}, 1fr)`,
            gap: "2px",
            background: "#000",
            height: "18vh",
            minHeight: "120px",
          }}
        >
          {others.map((c) => {
            const s = STREAMS.find((x) => x.court === c.court);
            return (
              <LiveTile
                key={c.court}
                court={c.court}
                youtubeVideoId={s?.youtubeVideoId ?? null}
                snapshot={c.snapshot}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
