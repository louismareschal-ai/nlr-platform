"use client";

import { useEffect, useState } from "react";
import { subscribeToMatch, type MatchSnapshot } from "@/lib/firebase/scoreboard";

type Props = {
  court: number;
  matchId: string;
};

function teamLabel(team: { name?: string; player_names?: string } | undefined): string {
  if (!team) return "—";
  return team.name?.trim() || team.player_names?.trim() || "—";
}

export default function ScoreOverlay({ court, matchId }: Props) {
  const [snapshot, setSnapshot] = useState<MatchSnapshot | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToMatch(matchId, setSnapshot);
    return unsubscribe;
  }, [matchId]);

  const match = snapshot?.match;
  const currentSet = snapshot?.currentSet;
  const setsWon = snapshot?.setsWon ?? { teamA: 0, teamB: 0 };
  const teamA = match?.teams_info?.team_a;
  const teamB = match?.teams_info?.team_b;
  const serveA = match?.serve_indicator?.team_a;
  const serveB = match?.serve_indicator?.team_b;
  const phase = match?.phase;

  const scoreA = currentSet?.team_a_score ?? 0;
  const scoreB = currentSet?.team_b_score ?? 0;

  const colorA = teamA?.color || "#e8b84b";
  const colorB = teamB?.color || "#f0ece3";

  return (
    <>
    <div
      style={{
        position: "fixed",
        left: "2.5vw",
        top: "3.5vh",
        fontFamily: "var(--font-display), 'Barlow Condensed', sans-serif",
        color: "#f0ece3",
        textShadow: "0 2px 8px rgba(0,0,0,0.85)",
        userSelect: "none",
      }}
    >
      <div
        style={{
          fontSize: "1.25rem",
          letterSpacing: "0.14em",
          color: "#e8b84b",
          marginBottom: "0.35rem",
          fontWeight: 600,
        }}
      >
        COURT {court}
        {phase ? <span style={{ color: "#f0ece3", opacity: 0.85, marginLeft: "0.75rem" }}>{phase}</span> : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto auto auto",
          gap: "0",
          background: "rgba(5,5,8,0.78)",
          backdropFilter: "blur(6px)",
          borderRadius: "10px",
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          border: "1px solid rgba(232,184,75,0.35)",
        }}
      >
        <TeamRow
          name={teamLabel(teamA)}
          color={colorA}
          score={scoreA}
          sets={setsWon.teamA}
          serving={serveA === "single_serve" || serveA === "double_serve"}
          serveType={serveA}
        />
        <Divider />
        <TeamRow
          name={teamLabel(teamB)}
          color={colorB}
          score={scoreB}
          sets={setsWon.teamB}
          serving={serveB === "single_serve" || serveB === "double_serve"}
          serveType={serveB}
        />
      </div>
    </div>
    <div
      style={{
        position: "fixed",
        right: "2.5vw",
        bottom: "4vh",
        userSelect: "none",
        filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/nlr-logo.svg" alt="NLR" style={{ height: "7.5vh", width: "auto", display: "block" }} />
    </div>
    </>
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

function TeamRow({
  name,
  color,
  score,
  sets,
  serving,
  serveType,
}: {
  name: string;
  color: string;
  score: number;
  sets: number;
  serving: boolean;
  serveType?: string;
}) {
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          padding: "0.7rem 1.1rem 0.7rem 0.9rem",
          minWidth: "16rem",
        }}
      >
        <div
          aria-hidden
          style={{
            width: "0.55rem",
            height: "1.9rem",
            background: color,
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: "0.55rem",
              height: "0.55rem",
              borderRadius: "50%",
              background: serving ? "#e8b84b" : "transparent",
              border: serving ? "none" : "1px solid rgba(240,236,227,0.2)",
              boxShadow: serving ? "0 0 8px rgba(232,184,75,0.85)" : "none",
            }}
            title={serveType || undefined}
          />
          <span style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "0.04em" }}>{name}</span>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.5rem 1.1rem",
          background: "rgba(232,184,75,0.08)",
          borderLeft: "1px solid rgba(232,184,75,0.18)",
          fontSize: "2.8rem",
          fontWeight: 800,
          lineHeight: 1,
          minWidth: "4.5rem",
        }}
      >
        {score}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0.5rem 0.95rem",
          background: "rgba(0,0,0,0.35)",
          borderLeft: "1px solid rgba(232,184,75,0.18)",
          fontSize: "1.65rem",
          fontWeight: 700,
          color: "#e8b84b",
          minWidth: "3rem",
        }}
      >
        {sets}
      </div>
    </>
  );
}
