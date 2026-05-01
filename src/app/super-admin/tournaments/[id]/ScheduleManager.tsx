"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Round {
  id: string;
  round_number: number;
  name: string;
  scheduled_start: string | null;
  status: string;
}

const ROUND_NAMES_8 = [
  "Quarterfinals",
  "Semifinals",
  "Finals",
];

export function ScheduleManager({
  tournamentId,
  rounds,
  squadCount,
}: {
  tournamentId: string;
  rounds: Round[];
  squadCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generateRounds() {
    if (squadCount < 2) {
      alert("Add squads first before generating the schedule.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    await supabase.from("rounds").delete().eq("tournament_id", tournamentId);

    // For 8 squads: 3 rounds
    const roundNames = ROUND_NAMES_8;
    const rows = roundNames.map((name, i) => ({
      tournament_id: tournamentId,
      round_number: i + 1,
      name,
      status: "pending",
    }));
    await supabase.from("rounds").insert(rows);
    router.refresh();
    setLoading(false);
  }

  async function updateTime(roundId: string, value: string) {
    const supabase = createClient();
    await supabase
      .from("rounds")
      .update({ scheduled_start: value ? new Date(value).toISOString() : null })
      .eq("id", roundId);
    router.refresh();
  }

  if (rounds.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#6b6b7a] mb-3">
          No rounds yet.{" "}
          {squadCount < 2
            ? "Add squads first."
            : "Generate the round schedule automatically."}
        </p>
        <Button onClick={generateRounds} loading={loading} disabled={squadCount < 2}>
          Generate schedule
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {rounds.map((r) => (
        <Card key={r.id}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{r.name}</p>
              <p className="text-xs text-[#6b6b7a] capitalize">Round {r.round_number} · {r.status}</p>
            </div>
            <input
              type="datetime-local"
              defaultValue={
                r.scheduled_start
                  ? new Date(r.scheduled_start).toISOString().slice(0, 16)
                  : ""
              }
              onBlur={(e) => updateTime(r.id, e.target.value)}
              className="px-2 py-1.5 text-sm rounded-lg border border-[#1a1a24] bg-[#13131a] text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
            />
          </div>
        </Card>
      ))}
      <Button variant="ghost" onClick={generateRounds} loading={loading} className="text-xs">
        Regenerate rounds
      </Button>
    </div>
  );
}
