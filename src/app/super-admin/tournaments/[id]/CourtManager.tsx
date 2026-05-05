"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Court {
  id: string;
  name: string;
  number: number;
}

export function CourtManager({
  tournamentId,
  courts,
  defaultCount,
}: {
  tournamentId: string;
  courts: Court[];
  defaultCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function generateCourts() {
    setLoading(true);
    const supabase = createClient();
    // Delete existing courts first
    await supabase.from("courts").delete().eq("tournament_id", tournamentId);
    // Insert courts 1..defaultCount
    const rows = Array.from({ length: defaultCount }, (_, i) => ({
      tournament_id: tournamentId,
      number: i + 1,
      name: `Court ${i + 1}`,
    }));
    await supabase.from("courts").insert(rows);
    router.refresh();
    setLoading(false);
  }

  async function renameCourt(courtId: string, name: string) {
    const supabase = createClient();
    await supabase.from("courts").update({ name }).eq("id", courtId);
    router.refresh();
  }

  if (courts.length === 0) {
    return (
      <Card>
        <p className="text-sm text-[#6b6b7a] mb-3">
          No courts yet. Generate {defaultCount} courts automatically.
        </p>
        <Button onClick={generateCourts} loading={loading}>
          Generate {defaultCount} courts
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {courts.map((c) => (
          <Card key={c.id}>
            <input
              defaultValue={c.name}
              onBlur={(e) => {
                if (e.target.value !== c.name) renameCourt(c.id, e.target.value);
              }}
              className="w-full text-sm font-medium bg-transparent text-[#f0ece3] focus:outline-none border-b border-transparent focus:border-[#e8b84b]/50"
            />
            <p className="text-xs text-[#6b6b7a] mt-0.5">#{c.number}</p>
          </Card>
        ))}
      </div>
      <Button variant="ghost" onClick={generateCourts} loading={loading} className="text-xs">
        Reset courts
      </Button>
    </div>
  );
}
