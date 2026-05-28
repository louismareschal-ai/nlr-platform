"use client";

import type { MatchSnapshot, Match, SetScore } from "@/lib/firebase/scoreboard";

type Props = {
  court: number;
  snapshot: MatchSnapshot | null;
};

const TEAM_A_COLOR = "#1f6feb";
const TEAM_B_COLOR = "#ff7a00";

function playerSurnames(team: { name?: string; player_names?: string } | undefined): string {
  if (!team) return "—";
  return team.player_names?.trim() || team.name?.trim() || "—";
}

function squadName(team: { name?: string; player_names?: string } | undefined): string {
  if (!team) return "";
  return team.name?.trim() || "";
}

function pastSets(match: Match | null, activeSetIndex: number): SetScore[] {
  if (!match?.score) return [];
  const result: SetScore[] = [];
  for (let i = 1; i < activeSetIndex; i++) {
    const s = match.score[`set_${i}`];
    if (s && (s.team_a_score !== undefined || s.team_b_score !== undefined)) {
      result.push(s);
    }
  }
  return result;
}

export default function ScoreboardBar({ court, snapshot }: Props) {
  const match = snapshot?.match ?? null;
  const currentSet = snapshot?.currentSet;
  const activeSetIndex = snapshot?.activeSetIndex ?? 1;
  const namesA = playerSurnames(match?.teams_info?.team_a);
  const namesB = playerSurnames(match?.teams_info?.team_b);
  const squadA = squadName(match?.teams_info?.team_a);
  const squadB = squadName(match?.teams_info?.team_b);
  const scoreA = currentSet?.team_a_score ?? 0;
  const scoreB = currentSet?.team_b_score ?? 0;
  const encounterA = match?.score?.squad_score?.team_a_score ?? 0;
  const encounterB = match?.score?.squad_score?.team_b_score ?? 0;
  const showEncounter = Boolean(squadA && squadB);
  const phase = match?.phase;
  const previous = pastSets(match, activeSetIndex);

  const wingStyle: React.CSSProperties = {
    flex: "1 1 auto",
    minWidth: 0,
    display: "flex",
    alignItems: "center",
    gap: "clamp(0.3rem, 1.2vw, 0.55rem)",
  };

  const nameStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: "clamp(0.6rem, 2vw, 0.9rem)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  };

  const colorBarStyle = (color: string): React.CSSProperties => ({
    width: "clamp(0.18rem, 0.7vw, 0.32rem)",
    height: "clamp(0.95rem, 2.8vw, 1.3rem)",
    background: color,
    borderRadius: "2px",
    flexShrink: 0,
  });

  return (
    <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none">
      <div
        className="flex flex-col items-stretch"
        style={{
          margin: "clamp(0.25rem, 1vw, 0.55rem)",
          padding: "clamp(0.3rem, 1vw, 0.55rem) clamp(0.55rem, 1.8vw, 1rem)",
          background: "rgba(5,5,8,0.86)",
          backdropFilter: "blur(6px)",
          borderRadius: "10px",
          border: "1px solid rgba(232,184,75,0.28)",
          fontFamily: "var(--font-display), sans-serif",
          gap: "clamp(0.15rem, 0.5vw, 0.28rem)",
          maxWidth: "calc(100% - clamp(3rem, 12vw, 5rem))",
        }}
      >
        <div
          className="flex items-baseline justify-center"
          style={{
            gap: "clamp(0.3rem, 1.2vw, 0.55rem)",
            color: "#e8b84b",
            letterSpacing: "0.16em",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: "clamp(0.6rem, 2vw, 0.85rem)" }}>
            COURT {court}
          </span>
          {phase ? (
            <span
              style={{
                color: "#f0ece3",
                opacity: 0.55,
                letterSpacing: "0.14em",
                fontSize: "clamp(0.55rem, 1.6vw, 0.75rem)",
              }}
            >
              · {phase}
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "clamp(0.3rem, 1.4vw, 0.7rem)",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ ...wingStyle, justifyContent: "flex-end", textAlign: "right" }}>
            <span style={nameStyle}>{namesA}</span>
            <span aria-hidden style={colorBarStyle(TEAM_A_COLOR)} />
          </div>

          <div
            className="flex flex-col items-center"
            style={{
              gap: "clamp(0.05rem, 0.25vw, 0.12rem)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: "clamp(0.95rem, 3.4vw, 1.4rem)",
                lineHeight: 1,
                color: "#f0ece3",
                padding: "0 clamp(0.15rem, 0.6vw, 0.3rem)",
                letterSpacing: "0.04em",
              }}
            >
              {scoreA}
              <span style={{ opacity: 0.4, padding: "0 0.2em" }}>–</span>
              {scoreB}
            </span>
            {previous.length > 0 ? (
              <span
                style={{
                  opacity: 0.55,
                  letterSpacing: "0.06em",
                  fontSize: "clamp(0.5rem, 1.4vw, 0.7rem)",
                  lineHeight: 1,
                }}
              >
                {previous
                  .map((s) => `${s.team_a_score ?? 0}–${s.team_b_score ?? 0}`)
                  .join(" · ")}
              </span>
            ) : null}
          </div>

          <div style={{ ...wingStyle, justifyContent: "flex-start", textAlign: "left" }}>
            <span aria-hidden style={colorBarStyle(TEAM_B_COLOR)} />
            <span style={nameStyle}>{namesB}</span>
          </div>
        </div>

        {showEncounter ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: "clamp(0.3rem, 1.2vw, 0.6rem)",
              whiteSpace: "nowrap",
              marginTop: "clamp(0.1rem, 0.3vw, 0.15rem)",
            }}
          >
            <div style={{ ...wingStyle, justifyContent: "flex-end" }}>
              <span
                style={{
                  color: "#f0ece3",
                  opacity: 0.75,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  fontSize: "clamp(0.55rem, 1.6vw, 0.75rem)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {squadA}
              </span>
            </div>
            <span
              style={{
                color: "#e8b84b",
                fontWeight: 800,
                letterSpacing: "0.06em",
                fontSize: "clamp(0.65rem, 2.1vw, 0.95rem)",
                background: "rgba(232,184,75,0.12)",
                borderRadius: "999px",
                padding: "clamp(0.05rem, 0.3vw, 0.15rem) clamp(0.4rem, 1.2vw, 0.6rem)",
                flexShrink: 0,
              }}
            >
              {encounterA} – {encounterB}
            </span>
            <div style={{ ...wingStyle, justifyContent: "flex-start" }}>
              <span
                style={{
                  color: "#f0ece3",
                  opacity: 0.75,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  fontSize: "clamp(0.55rem, 1.6vw, 0.75rem)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                {squadB}
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
