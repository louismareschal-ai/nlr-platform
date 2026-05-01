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
  gender: string;
}

interface Squad {
  id: string;
  name: string;
  seed: number | null;
  players: Player[];
}

export function SquadManager({
  tournamentId,
  squads,
}: {
  tournamentId: string;
  squads: Squad[];
}) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [seed, setSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addSquad() {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.from("squads").insert({
      tournament_id: tournamentId,
      name: name.trim(),
      seed: seed ? parseInt(seed) : null,
    });
    if (err) {
      setError(err.message);
    } else {
      setName("");
      setSeed("");
      setAdding(false);
      router.refresh();
    }
    setLoading(false);
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

  return (
    <div className="space-y-3">
      {squads.map((s) => (
        <Card key={s.id}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">{s.name}</p>
                {s.seed && <Badge variant="gold">Seed {s.seed}</Badge>}
              </div>
              <p className="text-xs text-[#6b6b7a]">
                {s.players.length} player{s.players.length !== 1 ? "s" : ""} ·{" "}
                {s.players.filter((p) => p.gender === "man").length} men ·{" "}
                {s.players.filter((p) => p.gender === "woman").length} women
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={32}
                defaultValue={s.seed ?? ""}
                placeholder="Seed"
                onBlur={(e) => updateSeed(s.id, e.target.value)}
                className="w-16 px-2 py-1 text-sm text-center rounded-lg border border-[#1a1a24] bg-[#13131a] text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
              />
              <button
                onClick={() => deleteSquad(s.id)}
                className="text-xs text-[#6b6b7a] hover:text-[#f87171] transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        </Card>
      ))}

      {adding ? (
        <Card>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Squad name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Team Alpha"
                autoFocus
              />
              <Input
                label="Seed (optional)"
                type="number"
                min={1}
                max={32}
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                placeholder="1"
              />
            </div>
            {error && <p className="text-xs text-[#f87171]">{error}</p>}
            <div className="flex gap-2">
              <Button onClick={addSquad} loading={loading} className="text-sm">
                Add squad
              </Button>
              <Button variant="ghost" onClick={() => setAdding(false)} className="text-sm">
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          + Add squad
        </Button>
      )}

      {squads.length === 8 && (
        <p className="text-xs text-[#34d399]">
          8 squads ready. You can generate the bracket from the Bracket page.
        </p>
      )}
    </div>
  );
}
