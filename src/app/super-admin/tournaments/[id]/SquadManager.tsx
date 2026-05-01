"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  gender: string;
}

interface Squad {
  id: string;
  name: string;
  seed: number | null;
  players: Player[];
}

function GenderPip({ gender }: { gender: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0
        ${gender === "man" ? "bg-[#1a2a3a] text-[#60a5fa]" : "bg-[#2a1a2e] text-[#e879f9]"}`}
    >
      {gender === "man" ? "M" : "W"}
    </span>
  );
}

export function SquadManager({
  tournamentId,
  squads,
  unassignedPlayers,
}: {
  tournamentId: string;
  squads: Squad[];
  unassignedPlayers: Player[];
}) {
  const router = useRouter();
  const [addingSquad, setAddingSquad] = useState(false);
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("");
  const [loadingSquad, setLoadingSquad] = useState(false);
  const [squadError, setSquadError] = useState<string | null>(null);
  const [assigningTo, setAssigningTo] = useState<string | null>(null);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);

  async function addSquad() {
    if (!name.trim()) return;
    setLoadingSquad(true);
    setSquadError(null);
    const supabase = createClient();
    const { error } = await supabase.from("squads").insert({
      tournament_id: tournamentId,
      name: name.trim(),
      seed: seed ? parseInt(seed) : null,
    });
    if (error) {
      setSquadError(error.message);
    } else {
      setName("");
      setSeed("");
      setAddingSquad(false);
      router.refresh();
    }
    setLoadingSquad(false);
  }

  async function updateSeed(squadId: string, newSeed: string) {
    const supabase = createClient();
    await supabase
      .from("squads")
      .update({ seed: newSeed ? parseInt(newSeed) : null })
      .eq("id", squadId);
    router.refresh();
  }

  async function deleteSquad(squadId: string) {
    if (!confirm("Delete this squad? This cannot be undone.")) return;
    const supabase = createClient();
    await supabase.from("squads").delete().eq("id", squadId);
    router.refresh();
  }

  async function assignPlayer(playerId: string, squadId: string) {
    setAssignLoading(playerId);
    const supabase = createClient();
    await supabase.from("players").update({ squad_id: squadId }).eq("id", playerId);
    setAssignLoading(null);
    router.refresh();
  }

  async function unassignPlayer(playerId: string) {
    const supabase = createClient();
    await supabase.from("players").update({ squad_id: null }).eq("id", playerId);
    router.refresh();
  }

  const menPool = unassignedPlayers.filter((p) => p.gender === "man");
  const womenPool = unassignedPlayers.filter((p) => p.gender === "woman");

  return (
    <div className="space-y-3">
      {squads.map((s) => {
        const men = s.players.filter((p) => p.gender === "man");
        const women = s.players.filter((p) => p.gender === "woman");
        const isFull = s.players.length >= 6;
        const isAssigning = assigningTo === s.id;
        const needsMen = men.length < 4;
        const needsWomen = women.length < 2;

        return (
          <Card key={s.id}>
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{s.name}</p>
                  {s.seed && <Badge variant="gold">Seed {s.seed}</Badge>}
                  {isFull && (
                    <span className="text-xs text-[#34d399] font-medium">✓ Complete</span>
                  )}
                </div>
                <p className="text-xs text-[#6b6b7a] mt-0.5">
                  {s.players.length}/6 · {men.length}/4 men · {women.length}/2 women
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={8}
                  defaultValue={s.seed ?? ""}
                  placeholder="Seed"
                  title="Set seed"
                  onBlur={(e) => updateSeed(s.id, e.target.value)}
                  className="w-14 px-2 py-1 text-sm text-center rounded-lg border border-[#1a1a24] bg-[#13131a] text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
                />
                <button
                  onClick={() => deleteSquad(s.id)}
                  className="text-xs text-[#6b6b7a] hover:text-[#f87171] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Player list */}
            {s.players.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#1a1a24] space-y-1.5">
                {s.players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2">
                      <GenderPip gender={p.gender} />
                      <span className="text-sm">
                        {p.first_name} {p.last_name}
                      </span>
                    </div>
                    <button
                      onClick={() => unassignPlayer(p.id)}
                      className="text-[#6b6b7a] hover:text-[#f87171] transition-colors opacity-0 group-hover:opacity-100 text-base leading-none px-1"
                      title="Remove from squad"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Assign players */}
            {!isFull && (
              <div className="mt-3">
                {isAssigning ? (
                  <div className="space-y-2">
                    {unassignedPlayers.length === 0 ? (
                      <p className="text-xs text-[#6b6b7a]">No unassigned players left.</p>
                    ) : (
                      <>
                        {needsMen && menPool.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#6b6b7a] uppercase tracking-wide mb-1">
                              Men ({4 - men.length} needed)
                            </p>
                            <div className="space-y-1">
                              {menPool.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => assignPlayer(p.id, s.id)}
                                  disabled={assignLoading === p.id}
                                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-[#13131a] hover:bg-[#1a1a24] border border-[#1a1a24] hover:border-[#e8b84b]/30 transition-colors text-left disabled:opacity-50"
                                >
                                  <GenderPip gender="man" />
                                  <span className="text-sm">
                                    {p.first_name} {p.last_name}
                                  </span>
                                  {assignLoading === p.id && (
                                    <span className="ml-auto text-xs text-[#6b6b7a]">…</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {needsWomen && womenPool.length > 0 && (
                          <div>
                            <p className="text-[10px] font-semibold text-[#6b6b7a] uppercase tracking-wide mb-1">
                              Women ({2 - women.length} needed)
                            </p>
                            <div className="space-y-1">
                              {womenPool.map((p) => (
                                <button
                                  key={p.id}
                                  onClick={() => assignPlayer(p.id, s.id)}
                                  disabled={assignLoading === p.id}
                                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-[#13131a] hover:bg-[#1a1a24] border border-[#1a1a24] hover:border-[#e8b84b]/30 transition-colors text-left disabled:opacity-50"
                                >
                                  <GenderPip gender="woman" />
                                  <span className="text-sm">
                                    {p.first_name} {p.last_name}
                                  </span>
                                  {assignLoading === p.id && (
                                    <span className="ml-auto text-xs text-[#6b6b7a]">…</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {!needsMen && menPool.length > 0 && (
                          <p className="text-xs text-[#6b6b7a]">
                            Men slots full — add women players above.
                          </p>
                        )}
                        {!needsWomen && womenPool.length > 0 && (
                          <p className="text-xs text-[#6b6b7a]">
                            Women slots full — add men players above.
                          </p>
                        )}
                      </>
                    )}
                    <button
                      onClick={() => setAssigningTo(null)}
                      className="text-xs text-[#6b6b7a] hover:text-[#f0ece3] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAssigningTo(s.id)}
                    className="text-sm text-[#e8b84b] hover:text-[#f0d080] transition-colors"
                  >
                    + Assign player
                  </button>
                )}
              </div>
            )}
          </Card>
        );
      })}

      {/* Add squad */}
      {addingSquad ? (
        <Card>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Squad name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSquad()}
                placeholder="Team Alpha"
                autoFocus
              />
              <Input
                label="Seed (optional)"
                type="number"
                min={1}
                max={8}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="1–8"
              />
            </div>
            {squadError && <p className="text-xs text-[#f87171]">{squadError}</p>}
            <div className="flex gap-2">
              <Button onClick={addSquad} loading={loadingSquad} className="text-sm">
                Add squad
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setAddingSquad(false);
                  setSquadError(null);
                }}
                className="text-sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        squads.length < 8 && (
          <Button variant="secondary" onClick={() => setAddingSquad(true)}>
            + Add squad
          </Button>
        )
      )}

      {squads.length === 8 && squads.every((s) => s.players.length >= 6) && (
        <p className="text-xs text-[#34d399] font-medium">
          ✓ All 8 squads complete — ready to move to Registration.
        </p>
      )}

      {/* Unassigned pool summary */}
      {unassignedPlayers.length > 0 && (
        <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-4">
          <p className="text-xs font-semibold text-[#6b6b7a] uppercase tracking-wide mb-2">
            Unassigned players ({unassignedPlayers.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {unassignedPlayers.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[#1a1a24] bg-[#13131a]"
              >
                <GenderPip gender={p.gender} />
                {p.first_name} {p.last_name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
