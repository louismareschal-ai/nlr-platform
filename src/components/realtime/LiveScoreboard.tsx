"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface GameRow {
  id: string;
  game_type: string;
  score_status: string;
  winner_squad_id: string | null;
  sets: Array<{ set_number: number; score_a: number; score_b: number }>;
}

interface EncounterRow {
  id: string;
  bracket_slot: string;
  status: string;
  squad_a: { id: string; name: string } | null;
  squad_b: { id: string; name: string } | null;
  games: GameRow[];
}

interface LiveScoreboardProps {
  tournamentId: string;
  initialEncounters: EncounterRow[];
}

export function LiveScoreboard({ tournamentId, initialEncounters }: LiveScoreboardProps) {
  const [encounters, setEncounters] = useState<EncounterRow[]>(initialEncounters);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
      .from("encounters")
      .select(`
        id, bracket_slot, status,
        squad_a:squads!encounters_squad_a_id_fkey(id, name),
        squad_b:squads!encounters_squad_b_id_fkey(id, name),
        games(id, game_type, score_status, winner_squad_id, sets)
      `)
      .eq("tournament_id", tournamentId)
      .in("status", ["composition", "mixed_round", "open_round", "scoring"]);

    if (data) setEncounters(data as unknown as EncounterRow[]);
  }

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`live-scoreboard:${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games" },
        () => refresh()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "encounters" },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = encounters.filter(
    (e) => !["pending", "completed"].includes(e.status)
  );

  if (active.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-6 text-center">
        <p className="text-sm text-[#6b6b7a]">No active encounters right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {active.map((enc) => {
        const squadA = enc.squad_a;
        const squadB = enc.squad_b;
        const winsA = enc.games.filter(
          (g) => g.score_status === "confirmed" && g.winner_squad_id === squadA?.id
        ).length;
        const winsB = enc.games.filter(
          (g) => g.score_status === "confirmed" && g.winner_squad_id === squadB?.id
        ).length;

        return (
          <div
            key={enc.id}
            className="rounded-xl border border-[#e8b84b]/20 bg-[#13131a] p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#e8b84b] font-medium uppercase tracking-wide">
                {enc.bracket_slot.replace(/_/g, " ")}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[#34d399]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#34d399] animate-pulse" />
                Live
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-sm font-medium">{squadA?.name ?? "TBD"}</p>
                <p
                  className="text-3xl font-bold text-[#e8b84b]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {winsA}
                </p>
              </div>
              <span className="text-lg text-[#6b6b7a]">vs</span>
              <div className="text-center">
                <p className="text-sm font-medium">{squadB?.name ?? "TBD"}</p>
                <p
                  className="text-3xl font-bold text-[#e8b84b]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {winsB}
                </p>
              </div>
            </div>

            {/* Game status dots */}
            <div className="flex gap-1.5 justify-center mt-3">
              {enc.games.map((g) => (
                <div
                  key={g.id}
                  title={g.game_type}
                  className={`w-2 h-2 rounded-full ${
                    g.score_status === "confirmed"
                      ? "bg-[#34d399]"
                      : g.score_status === "submitted"
                      ? "bg-[#fbbf24]"
                      : "bg-[#1a1a24]"
                  }`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
