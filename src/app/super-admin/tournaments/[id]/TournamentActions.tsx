"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const STATUS_FLOW = ["setup", "registration", "active", "completed"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_LABELS: Record<Status, string> = {
  setup: "Setup",
  registration: "Registration open",
  active: "Live",
  completed: "Completed",
};

const STATUS_DESCRIPTIONS: Record<Status, string> = {
  setup: "Configure squads, courts, and schedule before opening registration.",
  registration: "Squads can now be assigned players. Bracket is not yet live.",
  active: "Tournament is live. Scores can be entered.",
  completed: "Tournament is over. All results are locked.",
};

export function TournamentActions({ tournament }: { tournament: { id: string; status: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const currentIdx = STATUS_FLOW.indexOf(tournament.status as Status);
  const nextStatus = STATUS_FLOW[currentIdx + 1] as Status | undefined;

  async function advance() {
    if (!nextStatus) return;
    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("tournaments")
      .update({ status: nextStatus })
      .eq("id", tournament.id);
    router.refresh();
    setLoading(false);
  }

  return (
    <Card gold>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-[#6b6b7a] mb-0.5">Current status</p>
          <p className="font-semibold text-[#e8b84b]">
            {STATUS_LABELS[tournament.status as Status] ?? tournament.status}
          </p>
          <p className="text-sm text-[#6b6b7a] mt-1">
            {STATUS_DESCRIPTIONS[tournament.status as Status]}
          </p>
        </div>
        {nextStatus && (
          <Button onClick={advance} loading={loading}>
            Move to: {STATUS_LABELS[nextStatus]}
          </Button>
        )}
      </div>
    </Card>
  );
}
