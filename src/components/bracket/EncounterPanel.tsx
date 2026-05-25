"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ScoreEntry } from "@/components/scoring/ScoreEntry";
import type { GameSet, ScoreStatus } from "@/types";

const GAME_LABELS: Record<string, string> = {
  mixed1: "Mixed 1",
  mixed2: "Mixed 2",
  open1: "Open 1",
  open2: "Open 2",
  women: "Women",
};

const GAME_ORDER = ["mixed1", "mixed2", "open1", "open2", "women"];

interface Game {
  id: string;
  game_type: string;
  encounter_round: number;
  score_status: ScoreStatus;
  score_entered_by: string | null;
  score_confirmed_by: string | null;
  winner_squad_id: string | null;
  sets: GameSet[];
  courts: { name: string; number: number } | null;
}

interface CompositionSlot {
  label: string;
  player_id: string | null;
  playerName: string | null;
}

interface EncounterDetail {
  id: string;
  status: string;
  squad_a_id: string;
  squad_b_id: string;
  squad_a: { id: string; name: string };
  squad_b: { id: string; name: string };
  games: Game[];
  compositionA: CompositionSlot[] | null;
  compositionB: CompositionSlot[] | null;
}

interface EncounterPanelProps {
  encounterId: string | null;
  userRole: string | null;
  mySquadId: string | null;
  manageLinkBase?: string;
  tournamentSlug?: string;
  onClose: () => void;
}

export function EncounterPanel({
  encounterId,
  userRole,
  mySquadId,
  manageLinkBase,
  tournamentSlug,
  onClose,
}: EncounterPanelProps) {
  const [detail, setDetail] = useState<EncounterDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDetail = useCallback(async (id: string) => {
    setLoading(true);
    const supabase = createClient();

    const { data: enc } = await supabase
      .from("encounters")
      .select(`
        id, status, squad_a_id, squad_b_id,
        squad_a:squads!encounters_squad_a_id_fkey(id, name),
        squad_b:squads!encounters_squad_b_id_fkey(id, name),
        games(id, game_type, encounter_round, score_status, score_entered_by, score_confirmed_by, winner_squad_id, sets, courts(name, number))
      `)
      .eq("id", id)
      .single();

    if (!enc) { setLoading(false); return; }

    const squadA = enc.squad_a as unknown as { id: string; name: string };
    const squadB = enc.squad_b as unknown as { id: string; name: string };
    const games = (enc.games ?? []) as unknown as Game[];

    // Fetch compositions if revealed
    const { data: comps } = await supabase
      .from("compositions")
      .select(`
        squad_id, revealed_at,
        mixed1_player1:players!compositions_mixed1_player1_id_fkey(id, first_name, last_name),
        mixed1_player2:players!compositions_mixed1_player2_id_fkey(id, first_name, last_name),
        mixed2_player1:players!compositions_mixed2_player1_id_fkey(id, first_name, last_name),
        mixed2_player2:players!compositions_mixed2_player2_id_fkey(id, first_name, last_name),
        open1_player1:players!compositions_open1_player1_id_fkey(id, first_name, last_name),
        open1_player2:players!compositions_open1_player2_id_fkey(id, first_name, last_name),
        open2_player1:players!compositions_open2_player1_id_fkey(id, first_name, last_name),
        open2_player2:players!compositions_open2_player2_id_fkey(id, first_name, last_name),
        women_player1:players!compositions_women_player1_id_fkey(id, first_name, last_name),
        women_player2:players!compositions_women_player2_id_fkey(id, first_name, last_name)
      `)
      .eq("encounter_id", id);

    function buildSlots(comp: Record<string, unknown> | null): CompositionSlot[] | null {
      if (!comp || !comp.revealed_at) return null;
      const p = (key: string) => {
        const player = comp[key] as { first_name: string; last_name: string } | null;
        return player ? `${player.first_name} ${player.last_name}` : null;
      };
      return GAME_ORDER.map((gt) => ({
        label: GAME_LABELS[gt],
        player_id: null,
        playerName: `${p(gt + "_player1") ?? "?"} / ${p(gt + "_player2") ?? "?"}`,
      }));
    }

    const compA = comps?.find((c) => c.squad_id === squadA.id) ?? null;
    const compB = comps?.find((c) => c.squad_id === squadB.id) ?? null;

    setDetail({
      id: enc.id,
      status: enc.status,
      squad_a_id: squadA.id,
      squad_b_id: squadB.id,
      squad_a: squadA,
      squad_b: squadB,
      games: games.sort((a, b) => {
        const ri = a.encounter_round - b.encounter_round;
        return ri !== 0 ? ri : GAME_ORDER.indexOf(a.game_type) - GAME_ORDER.indexOf(b.game_type);
      }),
      compositionA: buildSlots(compA as Record<string, unknown> | null),
      compositionB: buildSlots(compB as Record<string, unknown> | null),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!encounterId) { setDetail(null); return; }
    fetchDetail(encounterId);

    // Realtime: refresh games on change
    const supabase = createClient();
    const channel = supabase
      .channel(`panel-${encounterId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "games", filter: `encounter_id=eq.${encounterId}` }, () => fetchDetail(encounterId))
      .on("postgres_changes", { event: "*", schema: "public", table: "compositions", filter: `encounter_id=eq.${encounterId}` }, () => fetchDetail(encounterId))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [encounterId, fetchDetail]);

  const open = !!encounterId;

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const confirmedGames = detail?.games.filter((g) => g.score_status === "confirmed") ?? [];
  const winsA = confirmedGames.filter((g) => g.winner_squad_id === detail?.squad_a_id).length;
  const winsB = confirmedGames.filter((g) => g.winner_squad_id === detail?.squad_b_id).length;

  const isMyEncounter =
    mySquadId &&
    detail &&
    (detail.squad_a_id === mySquadId || detail.squad_b_id === mySquadId);

  const round1 = detail?.games.filter((g) => g.encounter_round === 1) ?? [];
  const round2 = detail?.games.filter((g) => g.encounter_round === 2) ?? [];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full sm:w-[420px] bg-[#0d0d12] border-l border-[#1a1a24] z-50 flex flex-col overflow-y-auto transform transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a24] sticky top-0 bg-[#0d0d12]">
          <div>
            {detail ? (
              <>
                <p className="text-xs text-[#6b6b7a] mb-0.5 capitalize">{detail.status.replace("_", " ")}</p>
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  {tournamentSlug ? (
                    <>
                      <Link
                        href={`/tournaments/${tournamentSlug}/squads/${detail.squad_a_id}`}
                        className="hover:text-[#e8b84b] transition-colors"
                      >
                        {detail.squad_a.name}
                      </Link>{" "}
                      <span className="text-[#6b6b7a]">vs</span>{" "}
                      <Link
                        href={`/tournaments/${tournamentSlug}/squads/${detail.squad_b_id}`}
                        className="hover:text-[#e8b84b] transition-colors"
                      >
                        {detail.squad_b.name}
                      </Link>
                    </>
                  ) : (
                    <>{detail.squad_a.name} vs {detail.squad_b.name}</>
                  )}
                </h2>
              </>
            ) : (
              <p className="text-sm text-[#6b6b7a]">{loading ? "Loading..." : "Encounter"}</p>
            )}
          </div>
          <button onClick={onClose} className="text-[#6b6b7a] hover:text-[#f0ece3] text-xl leading-none p-1">
            ×
          </button>
        </div>

        {loading && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-[#6b6b7a]">Loading...</p>
          </div>
        )}

        {!loading && detail && (
          <div className="flex-1 p-5 space-y-6">
            {/* Score summary */}
            {confirmedGames.length > 0 && (
              <div className="rounded-xl border border-[#e8b84b]/20 bg-[#13131a] p-4">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-xs text-[#6b6b7a] mb-1 truncate max-w-24">{detail.squad_a.name}</p>
                    <p className={`text-5xl font-bold ${winsA >= 3 ? "text-[#e8b84b]" : "text-[#f0ece3]"}`} style={{ fontFamily: "var(--font-display)" }}>
                      {winsA}
                    </p>
                  </div>
                  <span className="text-2xl text-[#1a1a24]">|</span>
                  <div className="text-center">
                    <p className="text-xs text-[#6b6b7a] mb-1 truncate max-w-24">{detail.squad_b.name}</p>
                    <p className={`text-5xl font-bold ${winsB >= 3 ? "text-[#e8b84b]" : "text-[#f0ece3]"}`} style={{ fontFamily: "var(--font-display)" }}>
                      {winsB}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Composition */}
            {(detail.compositionA || detail.compositionB) && (
              <div>
                <p className="text-xs font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">Lineup</p>
                <div className="space-y-1">
                  {GAME_ORDER.map((gt) => {
                    const slotA = detail.compositionA?.find((s) => s.label === GAME_LABELS[gt]);
                    const slotB = detail.compositionB?.find((s) => s.label === GAME_LABELS[gt]);
                    return (
                      <div key={gt} className="rounded-lg border border-[#1a1a24] bg-[#13131a] px-3 py-2">
                        <p className="text-[10px] text-[#6b6b7a] font-medium uppercase tracking-wide mb-1">{GAME_LABELS[gt]}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#f0ece3]">{slotA?.playerName ?? "—"}</span>
                          <span className="text-[#6b6b7a] mx-2">vs</span>
                          <span className="text-[#f0ece3] text-right">{slotB?.playerName ?? "—"}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Games — score entry for squad_admin on own match, read-only otherwise */}
            {detail.games.length > 0 && (
              <div className="space-y-5">
                {round1.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">Round 1 — Mixed</p>
                    <div className="space-y-3">
                      {round1.map((g) => (
                        <ScoreEntry
                          key={g.id}
                          game={g}
                          squadAId={detail.squad_a_id}
                          squadBId={detail.squad_b_id}
                          squadAName={detail.squad_a.name}
                          squadBName={detail.squad_b.name}
                          mySquadId={isMyEncounter && userRole === "squad_admin" ? (mySquadId ?? "") : ""}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {round2.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">Round 2 — Open + Women</p>
                    <div className="space-y-3">
                      {round2.map((g) => (
                        <ScoreEntry
                          key={g.id}
                          game={g}
                          squadAId={detail.squad_a_id}
                          squadBId={detail.squad_b_id}
                          squadAName={detail.squad_a.name}
                          squadBName={detail.squad_b.name}
                          mySquadId={isMyEncounter && userRole === "squad_admin" ? (mySquadId ?? "") : ""}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No games yet */}
            {detail.games.length === 0 && (
              <p className="text-sm text-[#6b6b7a]">
                {detail.status === "composition"
                  ? "Waiting for both squads to submit their composition."
                  : "No games started yet."}
              </p>
            )}

            {/* Super admin link */}
            {userRole === "super_admin" && manageLinkBase && (
              <a
                href={`${manageLinkBase}/encounters/${detail.id}`}
                className="block text-center text-xs text-[#6b6b7a] hover:text-[#f0ece3] border border-[#1a1a24] rounded-lg py-2 transition-colors"
              >
                Open in Manage
              </a>
            )}
          </div>
        )}
      </div>
    </>
  );
}
