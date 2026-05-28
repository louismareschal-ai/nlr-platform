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

      <div
        className="absolute top-0 left-0"
        style={{
          padding: "clamp(0.25rem, 1vw, 0.45rem) clamp(0.4rem, 1.6vw, 0.65rem)",
          background: "rgba(5,5,8,0.82)",
          backdropFilter: "blur(6px)",
          borderBottomRightRadius: "8px",
          fontFamily: "var(--font-display), sans-serif",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto auto",
          alignItems: "center",
          rowGap: "clamp(0.08rem, 0.4vw, 0.18rem)",
          columnGap: "clamp(0.3rem, 1.2vw, 0.5rem)",
        }}
      >
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            alignItems: "baseline",
            gap: "clamp(0.3rem, 1.2vw, 0.55rem)",
            color: "#e8b84b",
            fontWeight: 700,
            letterSpacing: "0.16em",
            fontSize: "clamp(0.6rem, 2vw, 0.8rem)",
            marginBottom: "clamp(0.1rem, 0.5vw, 0.2rem)",
          }}
        >
          <span>COURT {court}</span>
          {phase ? (
            <span
              className="hidden sm:inline text-[#f0ece3]"
              style={{ opacity: 0.65, fontSize: "clamp(0.55rem, 1.7vw, 0.7rem)" }}
            >
              {phase}
            </span>
          ) : null}
        </div>
        <TeamLine name={teamA} color={TEAM_A_COLOR} score={scoreA} sets={setsWon.teamA} />
        <TeamLine name={teamB} color={TEAM_B_COLOR} score={scoreB} sets={setsWon.teamB} />
        {showEncounter ? (
          <div
            className="hidden sm:block text-[#e8b84b]"
            style={{
              gridColumn: "1 / -1",
              marginTop: "0.15rem",
              fontSize: "clamp(0.5rem, 1.5vw, 0.65rem)",
              letterSpacing: "0.18em",
              opacity: 0.85,
              textAlign: "left",
            }}
          >
            ENC {encounterA}–{encounterB}
          </div>
        ) : null}
      </div>

      <img
        src="/nlr-logo.svg"
        alt=""
        aria-hidden
        className="absolute top-0 right-0 pointer-events-none"
        style={{
          padding: "clamp(0.35rem, 1.4vw, 0.6rem) clamp(0.4rem, 1.6vw, 0.7rem)",
          height: "clamp(1.4rem, 4.5vw, 2.2rem)",
          width: "auto",
          opacity: 0.7,
          filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
        }}
      />
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
          width: "clamp(0.15rem, 0.7vw, 0.28rem)",
          height: "clamp(0.6rem, 2.2vw, 0.9rem)",
          background: color,
          borderRadius: "2px",
        }}
      />
      <span
        style={{
          fontWeight: 700,
          fontSize: "clamp(0.6rem, 2vw, 0.9rem)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          minWidth: 0,
          maxWidth: "clamp(3rem, 18vw, 9rem)",
        }}
      >
        {name}
      </span>
      <span
        style={{
          fontWeight: 800,
          fontSize: "clamp(0.95rem, 3.4vw, 1.4rem)",
          lineHeight: 1,
          minWidth: "clamp(1rem, 3.5vw, 1.5rem)",
          textAlign: "right",
          color: "#f0ece3",
        }}
      >
        {score}
      </span>
      <span
        style={{
          color: "#e8b84b",
          fontWeight: 700,
          fontSize: "clamp(0.55rem, 1.7vw, 0.8rem)",
          minWidth: "clamp(0.6rem, 2vw, 0.85rem)",
          textAlign: "right",
        }}
      >
        {sets}
      </span>
    </>
  );
}
