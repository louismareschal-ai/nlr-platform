"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const STATUS_FLOW = ["setup", "registration", "active", "completed"] as const;
type Status = (typeof STATUS_FLOW)[number];

const STATUS_LABELS: Record<Status, string> = {
  setup:        "Setup",
  registration: "Registration open",
  active:       "Live",
  completed:    "Completed",
};

const STATUS_DESCRIPTIONS: Record<Status, string> = {
  setup:        "You are setting up the tournament. Add all squads and their players before moving on.",
  registration: "Players can now log in and see their squad. You can still add courts and set the schedule. Move to Live when you are ready to start.",
  active:       "Tournament is live. Compositions can be submitted and scores can be entered.",
  completed:    "Tournament is over. All results are locked.",
};

const ADVANCE_CONFIRMATIONS: Record<Status, string> = {
  setup:
    "Move to Registration? Make sure all squads and players are added — you cannot go back.\n\nContinue?",
  registration:
    "Start the tournament? Courts and schedule must be set.\n\nOnce Live, players can enter compositions and scores.\n\nContinue?",
  active:
    "Mark the tournament as Completed? All scores will be locked.\n\nThis cannot be undone. Continue?",
  completed: "",
};

interface TournamentActionsProps {
  tournament: { id: string; status: string };
  squadCount: number;
  playerCount: number;
  courtCount: number;
  roundCount: number;
}

export function TournamentActions({
  tournament,
  squadCount,
  playerCount,
  courtCount,
  roundCount,
}: TournamentActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const currentStatus = tournament.status as Status;
  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
  const nextStatus = STATUS_FLOW[currentIdx + 1] as Status | undefined;

  // Prerequisites per status transition
  const blockers: string[] = [];
  if (currentStatus === "setup") {
    if (squadCount === 0) blockers.push("Add at least 2 squads.");
    if (playerCount < squadCount * 6)
      blockers.push(
        `Each squad needs 6 players (4 men + 2 women). Currently ${playerCount} players across ${squadCount} squad${squadCount !== 1 ? "s" : ""}.`
      );
  }
  if (currentStatus === "registration") {
    if (courtCount === 0) blockers.push("Generate courts before going live.");
    if (roundCount === 0) blockers.push("Generate the round schedule before going live.");
  }

  async function advance() {
    if (!nextStatus || blockers.length > 0) return;
    const confirmed = window.confirm(ADVANCE_CONFIRMATIONS[currentStatus]);
    if (!confirmed) return;

    setLoading(true);
    const supabase = createClient();
    await supabase
      .from("tournaments")
      .update({ status: nextStatus })
      .eq("id", tournament.id);
    router.refresh();
    setLoading(false);
  }

  const steps: { label: string; done: boolean; active: boolean }[] = [
    { label: "Setup", done: currentIdx > 0, active: currentIdx === 0 },
    { label: "Registration", done: currentIdx > 1, active: currentIdx === 1 },
    { label: "Live", done: currentIdx > 2, active: currentIdx === 2 },
    { label: "Completed", done: currentIdx >= 3, active: currentIdx === 3 },
  ];

  return (
    <Card gold>
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                  ${s.done ? "bg-[#34d399] text-[#050508]"
                    : s.active ? "bg-[#e8b84b] text-[#050508]"
                    : "bg-[#1a1a24] text-[#6b6b7a]"}`}
              >
                {s.done ? "✓" : i + 1}
              </div>
              <span
                className={`text-sm font-medium whitespace-nowrap
                  ${s.active ? "text-[#e8b84b]" : s.done ? "text-[#34d399]" : "text-[#6b6b7a]"}`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-px w-8 ${currentIdx > i ? "bg-[#34d399]" : "bg-[#1a1a24]"}`} />
            )}
          </div>
        ))}
      </div>

      <p className="text-sm text-[#6b6b7a] mb-3">
        {STATUS_DESCRIPTIONS[currentStatus]}
      </p>

      {/* Blockers */}
      {blockers.length > 0 && nextStatus && (
        <div className="mb-3 space-y-1">
          <p className="text-xs font-semibold text-[#fbbf24]">
            Before moving to {STATUS_LABELS[nextStatus]}:
          </p>
          {blockers.map((b, i) => (
            <p key={i} className="text-xs text-[#fbbf24]">· {b}</p>
          ))}
        </div>
      )}

      {nextStatus && currentStatus !== "completed" && (
        <Button
          onClick={advance}
          loading={loading}
          disabled={blockers.length > 0}
          variant={blockers.length > 0 ? "secondary" : "primary"}
        >
          Move to: {STATUS_LABELS[nextStatus]}
        </Button>
      )}
    </Card>
  );
}
