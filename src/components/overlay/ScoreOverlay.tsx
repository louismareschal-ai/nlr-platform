"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeToMatch, type MatchSnapshot } from "@/lib/firebase/scoreboard";
import { useAllMatches } from "@/lib/firebase/useAllMatches";
import { hasActivity } from "@/lib/firebase/activity";

type Props = {
  court: number;
  matchId: string;
};

const TEAM_A_COLOR = "#1f6feb"; // blue (pedal)
const TEAM_B_COLOR = "#ff7a00"; // orange (pedal)

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
  const encounterA = match?.score?.squad_score?.team_a_score ?? 0;
  const encounterB = match?.score?.squad_score?.team_b_score ?? 0;
  const showEncounter = encounterA + encounterB > 0;

  const scoreA = currentSet?.team_a_score ?? 0;
  const scoreB = currentSet?.team_b_score ?? 0;

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
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "1.25rem",
            letterSpacing: "0.14em",
            color: "#e8b84b",
            marginBottom: "0.35rem",
            fontWeight: 600,
          }}
        >
          <span>COURT {court}</span>
          {phase ? <span style={{ color: "#f0ece3", opacity: 0.85 }}>{phase}</span> : null}
          {showEncounter ? (
            <span
              style={{
                marginLeft: "0.25rem",
                padding: "0.18rem 0.65rem",
                background: "rgba(232,184,75,0.18)",
                border: "1px solid rgba(232,184,75,0.55)",
                borderRadius: "999px",
                color: "#e8b84b",
                fontSize: "1rem",
                letterSpacing: "0.1em",
              }}
            >
              ENCOUNTER {encounterA}–{encounterB}
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "auto auto auto",
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
            color={TEAM_A_COLOR}
            score={scoreA}
            sets={setsWon.teamA}
            serving={serveA === "single_serve" || serveA === "double_serve"}
            serveType={serveA}
          />
          <Divider />
          <TeamRow
            name={teamLabel(teamB)}
            color={TEAM_B_COLOR}
            score={scoreB}
            sets={setsWon.teamB}
            serving={serveB === "single_serve" || serveB === "double_serve"}
            serveType={serveB}
          />
        </div>
      </div>

      <OtherCourtsTicker excludeCourt={court} />

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

function OtherCourtsTicker({ excludeCourt }: { excludeCourt: number }) {
  const all = useAllMatches();
  const [index, setIndex] = useState(0);

  const others = useMemo(() => {
    return all.filter(
      (c) =>
        c.court !== excludeCourt &&
        c.snapshot?.match &&
        hasActivity(c.snapshot.match),
    );
  }, [all, excludeCourt]);

  useEffect(() => {
    if (others.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % others.length), 5000);
    return () => clearInterval(id);
  }, [others.length]);

  if (others.length === 0) return null;
  const current = others[index % others.length];
  if (!current?.snapshot?.match) return null;
  const m = current.snapshot.match;
  const cs = current.snapshot.currentSet;
  const nameA = teamLabel(m.teams_info?.team_a);
  const nameB = teamLabel(m.teams_info?.team_b);
  const scoreA = cs?.team_a_score ?? 0;
  const scoreB = cs?.team_b_score ?? 0;
  const setsA = current.snapshot.setsWon.teamA;
  const setsB = current.snapshot.setsWon.teamB;

  return (
    <div
      style={{
        position: "fixed",
        right: "2.5vw",
        top: "3.5vh",
        fontFamily: "var(--font-display), 'Barlow Condensed', sans-serif",
        color: "#f0ece3",
        textShadow: "0 2px 8px rgba(0,0,0,0.85)",
        userSelect: "none",
        minWidth: "20rem",
      }}
    >
      <div
        style={{
          fontSize: "0.95rem",
          letterSpacing: "0.18em",
          color: "#e8b84b",
          marginBottom: "0.3rem",
          fontWeight: 600,
          textAlign: "right",
        }}
      >
        COURT {current.court}
        <span style={{ color: "#6b6b7a", marginLeft: "0.5rem" }}>
          {index + 1}/{others.length}
        </span>
      </div>
      <div
        style={{
          background: "rgba(5,5,8,0.7)",
          backdropFilter: "blur(6px)",
          borderRadius: "8px",
          border: "1px solid rgba(232,184,75,0.25)",
          padding: "0.55rem 0.9rem",
          display: "grid",
          gridTemplateColumns: "1fr auto auto",
          alignItems: "center",
          rowGap: "0.3rem",
          columnGap: "0.9rem",
          fontSize: "1.05rem",
        }}
      >
        <TickerLine name={nameA} color={TEAM_A_COLOR} score={scoreA} sets={setsA} />
        <TickerLine name={nameB} color={TEAM_B_COLOR} score={scoreB} sets={setsB} />
      </div>
    </div>
  );
}

function TickerLine({
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
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
        <span
          aria-hidden
          style={{
            width: "0.4rem",
            height: "1rem",
            background: color,
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </span>
      </div>
      <span style={{ fontWeight: 800, fontSize: "1.35rem", lineHeight: 1, minWidth: "1.8rem", textAlign: "right" }}>
        {score}
      </span>
      <span
        style={{
          color: "#e8b84b",
          fontWeight: 700,
          minWidth: "1rem",
          textAlign: "right",
        }}
      >
        {sets}
      </span>
    </>
  );
}

