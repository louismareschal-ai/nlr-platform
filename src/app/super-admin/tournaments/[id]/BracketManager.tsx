"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Squad { id: string; name: string; seed: number | null; }
interface Court { id: string; name: string; number: number; }
interface Game  { id: string; game_type: string; court_id: string | null; encounter_round: number; }
interface Encounter {
  id: string;
  bracket_slot: string;
  squad_a_id: string | null;
  squad_b_id: string | null;
  status: string;
  games: Game[];
}

const GAME_TYPES: { type: string; label: string; phase: 1 | 2 }[] = [
  { type: "mixed1", label: "Mixed 1", phase: 1 },
  { type: "mixed2", label: "Mixed 2", phase: 1 },
  { type: "open1",  label: "Open 1",  phase: 2 },
  { type: "open2",  label: "Open 2",  phase: 2 },
  { type: "women",  label: "Women",   phase: 2 },
];

// QF seedings: slot → [seedA, seedB]
const QF_SLOTS: { slot: string; seeds: [number, number] }[] = [
  { slot: "qf_a", seeds: [1, 8] },
  { slot: "qf_b", seeds: [4, 5] },
  { slot: "qf_c", seeds: [2, 7] },
  { slot: "qf_d", seeds: [3, 6] },
];

export function BracketManager({
  tournamentId,
  roundId,
  squads,
  courts,
  encounters,
}: {
  tournamentId: string;
  roundId: string;
  squads: Squad[];
  courts: Court[];
  encounters: Encounter[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const squadBySeed = new Map(squads.map((s) => [s.seed, s]));
  const qfEncounters = encounters.filter((e) => e.bracket_slot.startsWith("qf_"));

  async function generateBracket() {
    setLoading(true);
    const supabase = createClient();

    // Delete existing QF encounters for this tournament
    await supabase
      .from("encounters")
      .delete()
      .eq("tournament_id", tournamentId)
      .like("bracket_slot", "qf_%");

    for (const { slot, seeds } of QF_SLOTS) {
      const squadA = squadBySeed.get(seeds[0]);
      const squadB = squadBySeed.get(seeds[1]);

      if (!squadA || !squadB) continue;

      const { data: enc, error } = await supabase
        .from("encounters")
        .insert({
          tournament_id: tournamentId,
          round_id: roundId,
          bracket_slot: slot,
          squad_a_id: squadA.id,
          squad_b_id: squadB.id,
          status: "pending",
        })
        .select("id")
        .single();

      if (error || !enc) continue;

      // Create 5 games per encounter
      const games = GAME_TYPES.map(({ type, phase }) => ({
        encounter_id: enc.id,
        game_type: type,
        encounter_round: phase,
        score_status: "pending",
        status: "pending",
        sets: [],
      }));
      await supabase.from("games").insert(games);
    }

    router.refresh();
    setLoading(false);
  }

  async function assignCourt(gameId: string, courtId: string | null) {
    setSaving(gameId);
    const supabase = createClient();
    await supabase
      .from("games")
      .update({ court_id: courtId || null })
      .eq("id", gameId);
    setSaving(null);
    router.refresh();
  }

  // Not enough seeds set
  const seededSquads = squads.filter((s) => s.seed !== null && s.seed >= 1 && s.seed <= 8);
  const readyToGenerate = seededSquads.length === 8;

  if (qfEncounters.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#6b6b7a] mb-1">
          {!readyToGenerate
            ? `Set seeds 1–8 on all squads first (${seededSquads.length}/8 done).`
            : "Generate the quarterfinal bracket based on seeds."}
        </p>
        {readyToGenerate && (
          <div className="text-xs text-[#6b6b7a] mb-3 space-y-0.5">
            {QF_SLOTS.map(({ slot, seeds }) => {
              const a = squadBySeed.get(seeds[0]);
              const b = squadBySeed.get(seeds[1]);
              return (
                <p key={slot}>
                  {slot.toUpperCase()}: Seed {seeds[0]} {a ? `(${a.name})` : "—"} vs Seed {seeds[1]} {b ? `(${b.name})` : "—"}
                </p>
              );
            })}
          </div>
        )}
        <Button onClick={generateBracket} loading={loading} disabled={!readyToGenerate}>
          Generate QF bracket
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {QF_SLOTS.map(({ slot, seeds }) => {
        const enc = qfEncounters.find((e) => e.bracket_slot === slot);
        if (!enc) return null;
        const squadA = squads.find((s) => s.id === enc.squad_a_id);
        const squadB = squads.find((s) => s.id === enc.squad_b_id);

        const mixedGames = enc.games.filter((g) => g.encounter_round === 1);
        const openGames  = enc.games.filter((g) => g.encounter_round === 2);

        return (
          <Card key={slot}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-[#6b6b7a] uppercase tracking-wide mb-0.5">
                  {slot.toUpperCase().replace("_", " ")}
                </p>
                <p className="font-semibold">
                  {squadA
                    ? <><span className="text-[#e8b84b]">#{seeds[0]}</span> {squadA.name}</>
                    : `Seed ${seeds[0]}`}
                  <span className="text-[#6b6b7a] mx-2 font-normal">vs</span>
                  {squadB
                    ? <><span className="text-[#e8b84b]">#{seeds[1]}</span> {squadB.name}</>
                    : `Seed ${seeds[1]}`}
                </p>
              </div>
            </div>

            {/* Phase 1 — Mixed */}
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-[#6b6b7a] uppercase tracking-widest mb-2">
                Phase 1 — Mixed round
              </p>
              <div className="space-y-2">
                {GAME_TYPES.filter((g) => g.phase === 1).map(({ type, label }) => {
                  const game = mixedGames.find((g) => g.game_type === type);
                  if (!game) return null;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-sm w-16 shrink-0">{label}</span>
                      <select
                        value={game.court_id ?? ""}
                        onChange={(e) => assignCourt(game.id, e.target.value)}
                        disabled={saving === game.id}
                        className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-[#1a1a24] bg-[#13131a]
                          text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50 disabled:opacity-50"
                      >
                        <option value="">No court</option>
                        {courts.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {game.court_id && (
                        <span className="text-xs text-[#34d399] shrink-0">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase 2 — Open / Women */}
            <div>
              <p className="text-[10px] font-semibold text-[#6b6b7a] uppercase tracking-widest mb-2">
                Phase 2 — Open + Women round
              </p>
              <div className="space-y-2">
                {GAME_TYPES.filter((g) => g.phase === 2).map(({ type, label }) => {
                  const game = openGames.find((g) => g.game_type === type);
                  if (!game) return null;
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-sm w-16 shrink-0">{label}</span>
                      <select
                        value={game.court_id ?? ""}
                        onChange={(e) => assignCourt(game.id, e.target.value)}
                        disabled={saving === game.id}
                        className="flex-1 px-2 py-1.5 text-sm rounded-lg border border-[#1a1a24] bg-[#13131a]
                          text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50 disabled:opacity-50"
                      >
                        <option value="">No court</option>
                        {courts.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {game.court_id && (
                        <span className="text-xs text-[#34d399] shrink-0">✓</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        );
      })}

      <Button variant="ghost" onClick={generateBracket} loading={loading} className="text-xs">
        Regenerate bracket
      </Button>
    </div>
  );
}
