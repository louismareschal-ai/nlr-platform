"use client";

import Link from "next/link";
import type { MatchSnapshot } from "@/lib/firebase/scoreboard";

type Props = {
  court: number;
  youtubeVideoId: string | null;
  snapshot: MatchSnapshot | null;
};

const TEAM_A_COLOR = "#1f6feb";
const TEAM_B_COLOR = "#ff7a00";

function teamLabel(team: { name?: string; player_names?: string } | undefined): string {
  if (!team) return "—";
  return team.name?.trim() || team.player_names?.trim() || "—";
}

export default function LiveTile({ court, youtubeVideoId, snapshot }: Props) {
  const match = snapshot?.match;
  const currentSet = snapshot?.currentSet;
  const setsWon = snapshot?.setsWon ?? { teamA: 0, teamB: 0 };
  const teamA = teamLabel(match?.teams_info?.team_a);
  const teamB = teamLabel(match?.teams_info?.team_b);
  const scoreA = currentSet?.team_a_score ?? 0;
  const scoreB = currentSet?.team_b_score ?? 0;
  const encounterA = match?.score?.squad_score?.team_a_score ?? 0;
  const encounterB = match?.score?.squad_score?.team_b_score ?? 0;
  const showEncounter = encounterA + encounterB > 0;
  const phase = match?.phase;

  const embedUrl = youtubeVideoId
    ? `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&playsinline=1`
    : null;

  return (
    <Link
      href={`/live/court/${court}`}
      style={{
        position: "relative",
        display: "block",
        background: "#05050a",
        overflow: "hidden",
        textDecoration: "none",
        color: "#f0ece3",
        border: "1px solid rgba(232,184,75,0.18)",
      }}
    >
      {embedUrl ? (
        <iframe
          src={embedUrl}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            border: "none",
            pointerEvents: "none",
          }}
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
              "radial-gradient(circle at 30% 30%, rgba(31,111,235,0.18), transparent 60%), radial-gradient(circle at 70% 70%, rgba(255,122,0,0.16), transparent 60%), #0a0a14",
            color: "#6b6b7a",
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "1rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Stream offline
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          padding: "0.45rem 0.7rem",
          background: "rgba(5,5,8,0.78)",
          backdropFilter: "blur(4px)",
          borderBottomRightRadius: "8px",
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "0.85rem",
          letterSpacing: "0.16em",
          color: "#e8b84b",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
        }}
      >
        <span>COURT {court}</span>
        {phase ? (
          <span style={{ color: "#f0ece3", opacity: 0.7, fontSize: "0.75rem" }}>{phase}</span>
        ) : null}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "0.55rem 0.7rem",
          background: "linear-gradient(180deg, rgba(5,5,8,0) 0%, rgba(5,5,8,0.92) 60%)",
          fontFamily: "var(--font-display), sans-serif",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto",
          rowGap: "0.2rem",
          columnGap: "0.55rem",
          alignItems: "center",
        }}
      >
        <TeamLine name={teamA} color={TEAM_A_COLOR} score={scoreA} sets={setsWon.teamA} />
        <TeamLine name={teamB} color={TEAM_B_COLOR} score={scoreB} sets={setsWon.teamB} />
        {showEncounter ? (
          <div
            style={{
              gridColumn: "1 / -1",
              marginTop: "0.15rem",
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              color: "#e8b84b",
              opacity: 0.85,
              textAlign: "right",
            }}
          >
            ENCOUNTER {encounterA}–{encounterB}
          </div>
        ) : null}
      </div>
    </Link>
  );
}

function TeamLine({
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
      <span
        aria-hidden
        style={{
          width: "0.3rem",
          height: "0.95rem",
          background: color,
          borderRadius: "2px",
        }}
      />
      <span
        style={{
          fontWeight: 700,
          fontSize: "0.95rem",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontWeight: 800,
          fontSize: "1.3rem",
          lineHeight: 1,
          minWidth: "1.5rem",
          textAlign: "right",
        }}
      >
        {score}
      </span>
      <span
        style={{
          color: "#e8b84b",
          fontWeight: 700,
          fontSize: "0.9rem",
          minWidth: "0.9rem",
          textAlign: "right",
        }}
      >
        {sets}
      </span>
    </>
  );
}
