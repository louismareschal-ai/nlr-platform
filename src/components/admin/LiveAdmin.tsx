"use client";

import Link from "next/link";
import { useAllMatches } from "@/lib/firebase/useAllMatches";
import { STREAMS } from "@/lib/firebase/streams";
import { COURTS } from "@/lib/firebase/courts";
import { hasActivity } from "@/lib/firebase/activity";

const TEAM_A_COLOR = "#1f6feb";
const TEAM_B_COLOR = "#ff7a00";

function teamLabel(team: { name?: string; player_names?: string } | undefined): string {
  if (!team) return "—";
  return team.name?.trim() || team.player_names?.trim() || "—";
}

export default function LiveAdmin() {
  const all = useAllMatches();
  const activeCount = all.filter((c) => hasActivity(c.snapshot?.match)).length;
  const streamReady = STREAMS.filter((s) => s.youtubeVideoId).length;

  return (
    <div style={{ padding: "1.5rem 2rem", color: "#f0ece3", minHeight: "100dvh" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display), sans-serif", fontSize: "1.8rem", fontWeight: 800, letterSpacing: "0.08em", margin: 0 }}>
            LIVE MONITORING
          </h1>
          <p style={{ color: "#6b6b7a", margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
            Real-time view of all 12 courts. Watch Firebase activity and stream wiring before and during the tournament.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
          <Pill label="Firebase active" value={`${activeCount}/${COURTS.length}`} color="#34d399" />
          <Pill label="YouTube wired" value={`${streamReady}/${COURTS.length}`} color={streamReady === COURTS.length ? "#34d399" : "#fbbf24"} />
          <Link
            href="/live"
            style={{
              padding: "0.5rem 0.9rem",
              background: "rgba(232,184,75,0.15)",
              border: "1px solid rgba(232,184,75,0.45)",
              borderRadius: "8px",
              color: "#e8b84b",
              textDecoration: "none",
              fontWeight: 700,
              letterSpacing: "0.14em",
              alignSelf: "center",
            }}
          >
            VIEW /live →
          </Link>
        </div>
      </header>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: "0.92rem" }}>
          <thead>
            <tr style={{ color: "#6b6b7a", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.72rem" }}>
              <Th>Court</Th>
              <Th>Firebase</Th>
              <Th>Stream</Th>
              <Th>Phase</Th>
              <Th>Team A (blue)</Th>
              <Th>Team B (orange)</Th>
              <Th align="right">Set score</Th>
              <Th align="right">Game sets</Th>
              <Th align="right">Encounter</Th>
              <Th align="right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {all.map((c) => {
              const stream = STREAMS.find((s) => s.court === c.court);
              const active = hasActivity(c.snapshot?.match);
              const match = c.snapshot?.match;
              const cs = c.snapshot?.currentSet;
              const setsWon = c.snapshot?.setsWon ?? { teamA: 0, teamB: 0 };
              const encA = match?.score?.squad_score?.team_a_score ?? 0;
              const encB = match?.score?.squad_score?.team_b_score ?? 0;
              const phase = match?.phase;
              return (
                <tr key={c.court} style={{ borderTop: "1px solid #1a1a24" }}>
                  <Td>
                    <Link href={`/live/court/${c.court}`} style={{ color: "#e8b84b", fontWeight: 700, textDecoration: "none" }}>
                      {String(c.court).padStart(2, "0")}
                    </Link>
                    <span style={{ color: "#6b6b7a", marginLeft: "0.5rem", fontSize: "0.78rem" }}>{c.matchId}</span>
                  </Td>
                  <Td>
                    <Dot color={active ? "#34d399" : "#6b6b7a"} />
                    <span style={{ marginLeft: "0.4rem", color: active ? "#f0ece3" : "#6b6b7a" }}>
                      {active ? "Live" : "Idle"}
                    </span>
                  </Td>
                  <Td>
                    {stream?.youtubeVideoId ? (
                      <>
                        <Dot color="#34d399" />
                        <span style={{ marginLeft: "0.4rem", fontFamily: "monospace", fontSize: "0.82rem" }}>{stream.youtubeVideoId}</span>
                      </>
                    ) : (
                      <>
                        <Dot color="#fbbf24" />
                        <span style={{ marginLeft: "0.4rem", color: "#6b6b7a" }}>Not configured</span>
                      </>
                    )}
                  </Td>
                  <Td>{phase || <span style={{ color: "#6b6b7a" }}>—</span>}</Td>
                  <Td><TeamCell name={teamLabel(match?.teams_info?.team_a)} color={TEAM_A_COLOR} /></Td>
                  <Td><TeamCell name={teamLabel(match?.teams_info?.team_b)} color={TEAM_B_COLOR} /></Td>
                  <Td align="right" mono>
                    {(cs?.team_a_score ?? 0)} : {(cs?.team_b_score ?? 0)}
                  </Td>
                  <Td align="right" mono>
                    {setsWon.teamA} : {setsWon.teamB}
                  </Td>
                  <Td align="right" mono>
                    {encA + encB > 0 ? `${encA} : ${encB}` : <span style={{ color: "#6b6b7a" }}>—</span>}
                  </Td>
                  <Td align="right">
                    <button
                      type="button"
                      disabled
                      title="Available once composition push (phase 6) is wired"
                      style={{
                        padding: "0.3rem 0.65rem",
                        background: "transparent",
                        border: "1px solid rgba(232,184,75,0.25)",
                        borderRadius: "6px",
                        color: "#6b6b7a",
                        fontSize: "0.78rem",
                        letterSpacing: "0.12em",
                        cursor: "not-allowed",
                      }}
                    >
                      RE-PUSH COMPO
                    </button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "0.6rem 0.85rem",
        fontWeight: 600,
        borderBottom: "1px solid #1a1a24",
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  align = "left",
  mono = false,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  mono?: boolean;
}) {
  return (
    <td
      style={{
        textAlign: align,
        padding: "0.6rem 0.85rem",
        fontFamily: mono ? "monospace" : undefined,
        verticalAlign: "middle",
      }}
    >
      {children}
    </td>
  );
}

function Pill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "0.4rem",
        padding: "0.45rem 0.75rem",
        background: "#13131a",
        border: "1px solid #1a1a24",
        borderRadius: "6px",
      }}
    >
      <span style={{ color: "#6b6b7a", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: "0.72rem" }}>{label}</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: "0.55rem",
        height: "0.55rem",
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 6px ${color}`,
        verticalAlign: "middle",
      }}
    />
  );
}

function TeamCell({ name, color }: { name: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <span aria-hidden style={{ width: "0.3rem", height: "1rem", background: color, borderRadius: "2px" }} />
      <span style={{ fontWeight: name === "—" ? 400 : 600, color: name === "—" ? "#6b6b7a" : "#f0ece3" }}>{name}</span>
    </div>
  );
}
