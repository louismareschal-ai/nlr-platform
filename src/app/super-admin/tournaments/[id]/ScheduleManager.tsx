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

// For 8-team all-placement single elimination: 3 rounds
const ROUND_DEFS = [
  { number: 1, name: "Quarterfinals",  dayOffset: 0 },
  { number: 2, name: "Semifinals",     dayOffset: 1 },
  { number: 3, name: "Finals Day",     dayOffset: 2 },
];

function dateOnlyFromISO(iso: string) {
  return iso.slice(0, 10); // "YYYY-MM-DD"
}

function timeOnlyFromISO(iso: string) {
  // iso is stored as UTC in DB, display as local
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function offsetDate(base: string, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ScheduleManager({
  tournamentId,
  tournamentDate,
  rounds,
  squadCount,
}: {
  tournamentId: string;
  tournamentDate: string;
  rounds: Round[];
  squadCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Local edits: { roundId → { date, time } }
  const [edits, setEdits] = useState<Record<string, { date: string; time: string }>>(() => {
    const map: Record<string, { date: string; time: string }> = {};
    for (const r of rounds) {
      map[r.id] = {
        date: r.scheduled_start ? dateOnlyFromISO(r.scheduled_start) : offsetDate(tournamentDate, r.round_number - 1),
        time: r.scheduled_start ? timeOnlyFromISO(r.scheduled_start) : "",
      };
    }
    return map;
  });

  async function generateRounds() {
    if (squadCount < 2) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("rounds").delete().eq("tournament_id", tournamentId);
    await supabase.from("rounds").insert(
      ROUND_DEFS.map((def) => ({
        tournament_id: tournamentId,
        round_number: def.number,
        name: def.name,
        status: "pending",
      }))
    );
    router.refresh();
    setLoading(false);
  }

  async function saveTime(roundId: string) {
    const edit = edits[roundId];
    if (!edit?.date || !edit?.time) return;
    const iso = new Date(`${edit.date}T${edit.time}:00`).toISOString();
    const supabase = createClient();
    await supabase.from("rounds").update({ scheduled_start: iso }).eq("id", roundId);
    router.refresh();
  }

  if (rounds.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#6b6b7a] mb-3">
          {squadCount < 2 ? "Add squads first." : "Generate the 3-round schedule (QF, SF, Finals)."}
        </p>
        <Button onClick={generateRounds} loading={loading} disabled={squadCount < 2}>
          Generate schedule
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {rounds.map((r) => {
        const edit = edits[r.id] ?? {
          date: offsetDate(tournamentDate, r.round_number - 1),
          time: "",
        };
        return (
          <Card key={r.id}>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-medium text-sm">{r.name}</p>
                <p className="text-xs text-[#6b6b7a] mt-0.5">Round {r.round_number}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* Date — pre-filled, editable */}
                <input
                  type="date"
                  value={edit.date}
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [r.id]: { ...edit, date: e.target.value } }))
                  }
                  onBlur={() => saveTime(r.id)}
                  className="px-2 py-1.5 text-sm rounded-lg border border-[#1a1a24] bg-[#13131a]
                    text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
                />
                {/* Time — what the user actually types */}
                <input
                  type="time"
                  value={edit.time}
                  placeholder="HH:MM"
                  onChange={(e) =>
                    setEdits((prev) => ({ ...prev, [r.id]: { ...edit, time: e.target.value } }))
                  }
                  onBlur={() => saveTime(r.id)}
                  className="w-28 px-2 py-1.5 text-sm rounded-lg border border-[#1a1a24] bg-[#13131a]
                    text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
                />
                {r.scheduled_start && (
                  <span className="text-xs text-[#34d399]">✓</span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
      <Button variant="ghost" onClick={generateRounds} loading={loading} className="text-xs">
        Reset schedule
      </Button>
    </div>
  );
}
