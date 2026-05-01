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
  photo_url: string | null;
}

interface Squad {
  id: string;
  name: string;
  seed: number | null;
  players: Player[];
}

// ── Shared sub-components ────────────────────────────────────────────────────

function Avatar({
  player,
  size = 40,
}: {
  player: Player;
  size?: number;
}) {
  const initials = `${player.first_name[0]}${player.last_name[0]}`.toUpperCase();
  return player.photo_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={player.photo_url}
      alt={`${player.first_name} ${player.last_name}`}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className="rounded-full bg-[#1a1a24] flex items-center justify-center text-xs font-bold text-[#6b6b7a]"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

function AssignedSlot({
  player,
  onRemove,
}: {
  player: Player;
  onRemove: () => void;
}) {
  return (
    <div className="relative group">
      <div className="w-10 h-10 rounded-full overflow-hidden">
        <Avatar player={player} size={40} />
      </div>
      <button
        onClick={onRemove}
        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f87171] text-white text-[10px] font-bold
          items-center justify-center hidden group-hover:flex transition-all shadow"
        title="Remove"
      >
        ×
      </button>
      <p className="text-[10px] text-[#6b6b7a] text-center mt-1 w-10 truncate">
        {player.first_name}
      </p>
    </div>
  );
}

function EmptySlot({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group"
    >
      <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#2a2a36] bg-[#0d0d12]
        flex items-center justify-center text-[#3a3a4a] group-hover:border-[#e8b84b]/50
        group-hover:text-[#e8b84b] transition-colors">
        <span className="text-lg leading-none">+</span>
      </div>
      <p className="text-[10px] text-transparent group-hover:text-[#e8b84b] transition-colors">Add</p>
    </button>
  );
}

// ── Player picker (inline) ───────────────────────────────────────────────────

function PlayerPicker({
  gender,
  players,
  onPick,
  onClose,
  loading,
}: {
  gender: "man" | "woman";
  players: Player[];
  onPick: (id: string) => void;
  onClose: () => void;
  loading: string | null;
}) {
  const [search, setSearch] = useState("");
  const filtered = players.filter((p) =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );
  const label = gender === "man" ? "men" : "women";

  return (
    <div className="mt-4 pt-4 border-t border-[#1a1a24]">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-[#f0ece3]">
          Add {gender === "man" ? "a man" : "a woman"}
        </p>
        <button
          onClick={onClose}
          className="text-xs text-[#6b6b7a] hover:text-[#f0ece3] transition-colors"
        >
          Cancel
        </button>
      </div>

      {players.length === 0 ? (
        <p className="text-sm text-[#6b6b7a]">No unassigned {label} left.</p>
      ) : (
        <>
          {players.length > 4 && (
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full mb-2 px-3 py-1.5 text-sm rounded-lg border border-[#1a1a24] bg-[#0d0d12]
                text-[#f0ece3] placeholder-[#3a3a4a] focus:outline-none focus:border-[#e8b84b]/50"
            />
          )}
          <div className="space-y-1 max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-[#6b6b7a]">No results.</p>
            ) : (
              filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onPick(p.id)}
                  disabled={loading === p.id}
                  className="flex items-center gap-3 w-full px-3 py-2 rounded-xl bg-[#0d0d12]
                    hover:bg-[#13131a] border border-transparent hover:border-[#e8b84b]/20
                    transition-all text-left disabled:opacity-50"
                >
                  <Avatar player={p} size={32} />
                  <span className="text-sm flex-1">
                    {p.first_name} {p.last_name}
                  </span>
                  {loading === p.id ? (
                    <span className="text-xs text-[#6b6b7a]">…</span>
                  ) : (
                    <span className="text-xs text-[#e8b84b] opacity-0 group-hover:opacity-100">Add →</span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

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
  const [picker, setPicker] = useState<{ squadId: string; gender: "man" | "woman" } | null>(null);
  const [assignLoading, setAssignLoading] = useState<string | null>(null);

  const supabase = createClient();

  async function addSquad() {
    if (!name.trim()) return;
    setLoadingSquad(true);
    setSquadError(null);
    const { error } = await supabase.from("squads").insert({
      tournament_id: tournamentId,
      name: name.trim(),
      seed: seed ? parseInt(seed) : null,
    });
    if (error) {
      setSquadError(error.message);
    } else {
      setName(""); setSeed(""); setAddingSquad(false);
      router.refresh();
    }
    setLoadingSquad(false);
  }

  async function updateSeed(squadId: string, newSeed: string) {
    await supabase
      .from("squads")
      .update({ seed: newSeed ? parseInt(newSeed) : null })
      .eq("id", squadId);
    router.refresh();
  }

  async function deleteSquad(squadId: string) {
    if (!confirm("Delete this squad and unassign all its players?")) return;
    await supabase.from("squads").delete().eq("id", squadId);
    router.refresh();
  }

  async function assignPlayer(playerId: string, squadId: string) {
    setAssignLoading(playerId);
    await supabase.from("players").update({ squad_id: squadId }).eq("id", playerId);
    setAssignLoading(null);
    setPicker(null);
    router.refresh();
  }

  async function unassignPlayer(playerId: string) {
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
        const isFull = men.length >= 4 && women.length >= 2;
        const isPickingMen = picker?.squadId === s.id && picker.gender === "man";
        const isPickingWomen = picker?.squadId === s.id && picker.gender === "woman";

        return (
          <Card key={s.id}>
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 min-w-0">
                <p className="font-semibold truncate">{s.name}</p>
                {isFull && (
                  <span className="text-xs text-[#34d399] font-medium shrink-0">✓</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={1} max={8}
                  defaultValue={s.seed ?? ""}
                  placeholder="Seed"
                  onBlur={(e) => updateSeed(s.id, e.target.value)}
                  className="w-14 px-2 py-1 text-sm text-center rounded-lg border border-[#1a1a24]
                    bg-[#13131a] text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
                />
                <button
                  onClick={() => deleteSquad(s.id)}
                  className="text-[10px] text-[#3a3a4a] hover:text-[#f87171] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Men row */}
            <div className="mt-4">
              <p className="text-[10px] font-semibold text-[#6b6b7a] uppercase tracking-widest mb-2">
                Men · {men.length}/4
              </p>
              <div className="flex gap-3 flex-wrap">
                {men.map((p) => (
                  <AssignedSlot key={p.id} player={p} onRemove={() => unassignPlayer(p.id)} />
                ))}
                {men.length < 4 &&
                  Array.from({ length: 4 - men.length }).map((_, i) => (
                    <EmptySlot
                      key={i}
                      onClick={() =>
                        setPicker(
                          isPickingMen ? null : { squadId: s.id, gender: "man" }
                        )
                      }
                    />
                  ))}
              </div>
            </div>

            {/* Women row */}
            <div className="mt-4">
              <p className="text-[10px] font-semibold text-[#6b6b7a] uppercase tracking-widest mb-2">
                Women · {women.length}/2
              </p>
              <div className="flex gap-3 flex-wrap">
                {women.map((p) => (
                  <AssignedSlot key={p.id} player={p} onRemove={() => unassignPlayer(p.id)} />
                ))}
                {women.length < 2 &&
                  Array.from({ length: 2 - women.length }).map((_, i) => (
                    <EmptySlot
                      key={i}
                      onClick={() =>
                        setPicker(
                          isPickingWomen ? null : { squadId: s.id, gender: "woman" }
                        )
                      }
                    />
                  ))}
              </div>
            </div>

            {/* Inline picker */}
            {(isPickingMen || isPickingWomen) && (
              <PlayerPicker
                gender={picker!.gender}
                players={picker!.gender === "man" ? menPool : womenPool}
                onPick={(id) => assignPlayer(id, s.id)}
                onClose={() => setPicker(null)}
                loading={assignLoading}
              />
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
                placeholder="Germany 1"
                autoFocus
              />
              <Input
                label="Seed"
                type="number"
                min={1} max={8}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="1–8"
              />
            </div>
            {squadError && <p className="text-xs text-[#f87171]">{squadError}</p>}
            <div className="flex gap-2">
              <Button onClick={addSquad} loading={loadingSquad}>Add squad</Button>
              <Button variant="ghost" onClick={() => { setAddingSquad(false); setSquadError(null); }}>
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

      {/* Global unassigned count */}
      {unassignedPlayers.length > 0 && (
        <p className="text-xs text-[#6b6b7a]">
          {menPool.length} men · {womenPool.length} women still unassigned
        </p>
      )}

      {squads.length === 8 && squads.every((s) => s.players.length >= 6) && (
        <p className="text-xs text-[#34d399] font-medium">
          ✓ All 8 squads complete
        </p>
      )}
    </div>
  );
}
