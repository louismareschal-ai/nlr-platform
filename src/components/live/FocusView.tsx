"use client";

import Link from "next/link";
import { useAllMatches } from "@/lib/firebase/useAllMatches";
import { STREAMS, streamForCourt } from "@/lib/firebase/streams";
import { matchIdForCourt } from "@/lib/firebase/courts";
import LiveTile from "./LiveTile";

const TEAM_A_COLOR = "#1f6feb";
const TEAM_B_COLOR = "#ff7a00";

function teamLabel(team: { name?: string; player_names?: string } | undefined): string {
  if (!team) return "—";
  return team.name?.trim() || team.player_names?.trim() || "—";
}

export default function FocusView({ court }: { court: number }) {
  const all = useAllMatches();
  const main = all.find((c) => c.court === court);
  const others = all.filter((c) => c.court !== court);

  const matchId = matchIdForCourt(court);
  const stream = streamForCourt(court);
  const youtubeVideoId = stream?.youtubeVideoId ?? null;

  const match = main?.snapshot?.match;
  const currentSet = main?.snapshot?.currentSet;
  const setsWon = main?.snapshot?.setsWon ?? { teamA: 0, teamB: 0 };
  const teamA = teamLabel(match?.teams_info?.team_a);
  const teamB = teamLabel(match?.teams_info?.team_b);
  const scoreA = currentSet?.team_a_score ?? 0;
  const scoreB = currentSet?.team_b_score ?? 0;
  const encounterA = match?.score?.squad_score?.team_a_score ?? 0;
  const encounterB = match?.score?.squad_score?.team_b_score ?? 0;
  const showEncounter = encounterA + encounterB > 0;
  const phase = match?.phase;

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

        <Link
          href="/live"
          style={{
            position: "absolute",
            top: "1.5vh",
            left: "1.5vw",
            padding: "0.5rem 1rem",
            background: "rgba(5,5,8,0.78)",
            backdropFilter: "blur(4px)",
            borderRadius: "8px",
            border: "1px solid rgba(232,184,75,0.3)",
            color: "#e8b84b",
            textDecoration: "none",
            fontSize: "0.95rem",
            letterSpacing: "0.18em",
            fontWeight: 700,
            zIndex: 2,
          }}
        >
          ← ALL COURTS
        </Link>

        <div
          style={{
            position: "absolute",
            top: "1.5vh",
            right: "1.5vw",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.5rem 1rem",
            background: "rgba(5,5,8,0.78)",
            backdropFilter: "blur(4px)",
            borderRadius: "8px",
            border: "1px solid rgba(232,184,75,0.3)",
            zIndex: 2,
            fontSize: "1rem",
            letterSpacing: "0.16em",
          }}
        >
          <span style={{ color: "#e8b84b", fontWeight: 700 }}>COURT {court}</span>
          {phase ? <span style={{ opacity: 0.85 }}>{phase}</span> : null}
          {showEncounter ? (
            <span
              style={{
                padding: "0.18rem 0.6rem",
                background: "rgba(232,184,75,0.18)",
                border: "1px solid rgba(232,184,75,0.55)",
                borderRadius: "999px",
                color: "#e8b84b",
                fontSize: "0.85rem",
              }}
            >
              ENC {encounterA}–{encounterB}
            </span>
          ) : null}
        </div>

        <div
          style={{
            position: "absolute",
            left: "1.5vw",
            bottom: "1.5vh",
            display: "grid",
            gridTemplateColumns: "auto auto auto auto",
            gap: "0",
            background: "rgba(5,5,8,0.82)",
            backdropFilter: "blur(6px)",
            borderRadius: "10px",
            overflow: "hidden",
            border: "1px solid rgba(232,184,75,0.35)",
            zIndex: 2,
          }}
        >
          <FocusTeamRow name={teamA} color={TEAM_A_COLOR} score={scoreA} sets={setsWon.teamA} />
          <Divider />
          <FocusTeamRow name={teamB} color={TEAM_B_COLOR} score={scoreB} sets={setsWon.teamB} />
        </div>
      </div>

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
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        height: "1px",
        background: "rgba(232,184,75,0.25)",
      }}
    />
  );
}

function FocusTeamRow({
  name,
  color,
  score,
  sets,
}: {
  name: string;
  color: string;
  score: number;
  sets: number;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.7rem",
          padding: "0.75rem 1.2rem 0.75rem 0.9rem",
          minWidth: "18rem",
        }}
      >
        <div
          aria-hidden
          style={{
            width: "0.55rem",
            height: "2.1rem",
            background: color,
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "0.04em" }}>{name}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.55rem 1.2rem",
          background: "rgba(232,184,75,0.08)",
          borderLeft: "1px solid rgba(232,184,75,0.18)",
          fontSize: "3.2rem",
          fontWeight: 800,
          lineHeight: 1,
          minWidth: "5rem",
          color: "#f0ece3",
        }}
      >
        {score}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.55rem 1rem",
          background: "rgba(0,0,0,0.35)",
          borderLeft: "1px solid rgba(232,184,75,0.18)",
          fontSize: "1.85rem",
          fontWeight: 700,
          color: "#e8b84b",
          minWidth: "3.2rem",
        }}
      >
        {sets}
      </div>
    </>
  );
}
