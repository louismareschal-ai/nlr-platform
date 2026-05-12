"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isValidSetScore, gameWinner } from "@/lib/tournament/bracket";
import { createEncounterGames, advanceEncounter } from "@/app/actions/bracket";
import { enterRandomComposition } from "@/app/actions/compositions";
import type { GameType, GameSet, ScoreStatus } from "@/types";

interface GameData {
  id: string;
  game_type: GameType;
  score_status: ScoreStatus;
  winner_squad_id: string | null;
  sets: GameSet[];
  courts: { name: string; number: number } | null;
}

interface EncounterActionsProps {
  encounterId: string;
  currentStatus: string;
  squadAId: string;
  squadBId: string;
  squadAName: string;
  squadBName: string;
  compositionRevealed: boolean;
  games: GameData[];
}

const STATUS_LABELS: Record<string, string> = {
  composition: "Composition Phase",
  mixed_round: "Start Mixed Round",
  open_round: "Start Open + Women Round",
  scoring: "Scoring Phase",
  completed: "Mark Complete",
};

const STATUS_DESCRIPTIONS: Record<string, string> = {
  composition: "Moves the encounter to composition phase. Both squad admins will need to submit their lineups before games can start.",
  mixed_round: "Starts the Mixed round (Mixed 1 + Mixed 2). Both compositions must be revealed first.",
  open_round: "Starts the Open + Women round (Open 1, Open 2, Women).",
  scoring: "Moves to manual scoring mode.",
  completed: "Forces the encounter to completed. Only use if all games are done and confirmed.",
};

export function EncounterActions({
  encounterId,
  currentStatus,
  squadAId,
  squadBId,
  squadAName,
  squadBName,
  compositionRevealed,
  games,
}: EncounterActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [overrideGameId, setOverrideGameId] = useState<string | null>(null);
  const [overrideSets, setOverrideSets] = useState<{ a: string; b: string }[]>([
    { a: "", b: "" },
    { a: "", b: "" },
    { a: "", b: "" },
  ]);
  const [overrideErrors, setOverrideErrors] = useState<string[]>([]);

  const supabase = createClient();

  async function advanceStatus(newStatus: string) {
    setLoading(true);
    setError(null);
    setPendingStatus(null);

    if (newStatus === "mixed_round" && games.length === 0) {
      const result = await createEncounterGames(encounterId);
      if (!result.success) {
        setError(result.error ?? "Failed to create games");
        setLoading(false);
        return;
      }
    }

    const { error: err } = await supabase
      .from("encounters")
      .update({ status: newStatus })
      .eq("id", encounterId);
    if (err) setError(err.message);
    else window.location.reload();
    setLoading(false);
  }

  async function handleOverrideSubmit(gameId: string) {
    const errs: string[] = [];
    const sets: GameSet[] = [];
    let winsA = 0;
    let winsB = 0;

    for (let i = 0; i < 3; i++) {
      const a = parseInt(overrideSets[i].a);
      const b = parseInt(overrideSets[i].b);
      if (winsA >= 2 || winsB >= 2) break;
      if (isNaN(a) || isNaN(b)) {
        if (i < 2) errs.push(`Set ${i + 1}: both scores required.`);
        break;
      }
      if (!isValidSetScore(a, b)) {
        errs.push(`Set ${i + 1}: ${a}-${b} is not valid.`);
        break;
      }
      sets.push({ set_number: (i + 1) as 1 | 2 | 3, score_a: a, score_b: b });
      if (a > b) winsA++;
      else winsB++;
    }

    if (sets.length > 0 && winsA < 2 && winsB < 2) {
      errs.push("Game not finished — one team needs 2 wins.");
    }

    setOverrideErrors(errs);
    if (errs.length > 0) return;

    setLoading(true);
    const winner = gameWinner(sets.map((s) => ({ score_a: s.score_a, score_b: s.score_b })));
    const winner_squad_id = winner === "a" ? squadAId : winner === "b" ? squadBId : null;

    const { error: err } = await supabase
      .from("games")
      .update({
        sets,
        score_status: "confirmed",
        score_entered_by: null,
        score_entered_at: new Date().toISOString(),
        score_confirmed_at: new Date().toISOString(),
        winner_squad_id,
        status: "completed",
      })
      .eq("id", gameId);

    if (err) {
      setOverrideErrors([err.message]);
      setLoading(false);
      return;
    }

    await advanceEncounter(encounterId);
    setOverrideGameId(null);
    window.location.reload();
    setLoading(false);
  }

  async function handleRandomComposition(squadId: string) {
    setLoading(true);
    setError(null);
    const result = await enterRandomComposition(encounterId, squadId);
    if (!result.success) setError(result.error ?? "Failed");
    else window.location.reload();
    setLoading(false);
  }

  const statusFlow: Record<string, string[]> = {
    pending: ["composition"],
    composition: ["mixed_round"],
    mixed_round: ["open_round"],
    open_round: ["scoring", "completed"],
    scoring: ["completed"],
    completed: [],
  };

  const nextStatuses = statusFlow[currentStatus] ?? [];

  return (
    <div className="space-y-4">
      {/* Status controls */}
      <Card>
        <p className="label-overline mb-3">Super Admin Controls</p>

        {/* Confirmation prompt */}
        {pendingStatus && (
          <div className="mb-3 p-3 rounded-lg border border-[#e8b84b]/30 bg-[#e8b84b]/5">
            <p className="text-sm font-medium mb-1">
              Advance to: <span className="text-[#e8b84b]">{STATUS_LABELS[pendingStatus] ?? pendingStatus}</span>
            </p>
            <p className="text-xs text-[#6b6b7a] mb-3">{STATUS_DESCRIPTIONS[pendingStatus]}</p>
            {pendingStatus === "mixed_round" && !compositionRevealed && (
              <p className="text-xs text-[#f87171] mb-3">
                Compositions are not revealed yet. Both squads must submit before starting the Mixed round.
              </p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => advanceStatus(pendingStatus)}
                loading={loading}
                disabled={pendingStatus === "mixed_round" && !compositionRevealed}
                className="text-xs py-1.5"
              >
                Confirm
              </Button>
              <Button
                variant="ghost"
                onClick={() => setPendingStatus(null)}
                className="text-xs py-1.5"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!pendingStatus && (
          <div className="flex gap-2 flex-wrap">
            {nextStatuses.map((s) => (
              <Button
                key={s}
                variant="secondary"
                loading={loading}
                onClick={() => setPendingStatus(s)}
                className="text-sm"
              >
                {STATUS_LABELS[s] ?? `Advance to ${s.replace(/_/g, " ")}`}
              </Button>
            ))}
            {currentStatus !== "completed" && (
              <Button
                variant="danger"
                loading={loading}
                onClick={() => setPendingStatus("completed")}
                className="text-sm"
              >
                Force complete
              </Button>
            )}
            <Button
              variant="ghost"
              loading={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                const result = await advanceEncounter(encounterId);
                if (!result.success) setError(result.error ?? "Advance failed");
                else window.location.reload();
                setLoading(false);
              }}
              className="text-sm"
            >
              Recalculate bracket
            </Button>
          </div>
        )}

        {error && <p className="text-xs text-[#f87171] mt-2">{error}</p>}
      </Card>

      {/* Random composition (testing shortcut) */}
      {currentStatus === "composition" && (
        <Card>
          <p className="label-overline mb-2">Testing Shortcuts</p>
          <p className="text-xs text-[#6b6b7a] mb-3">
            Auto-fill a valid composition (sorted by points, highest-points players in slot 1).
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="ghost"
              loading={loading}
              onClick={() => handleRandomComposition(squadAId)}
              className="text-xs"
            >
              Fill {squadAName} composition
            </Button>
            <Button
              variant="ghost"
              loading={loading}
              onClick={() => handleRandomComposition(squadBId)}
              className="text-xs"
            >
              Fill {squadBName} composition
            </Button>
          </div>
        </Card>
      )}

      {/* Score overrides */}
      {games.length > 0 && (
        <Card>
          <p className="label-overline mb-3">Override Scores</p>
          <div className="space-y-2">
            {games.map((g) => (
              <div key={g.id} className="border border-[#1a1a24] rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {g.game_type.replace(/(\d)/, " $1").replace(/^./, (c) => c.toUpperCase())}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (overrideGameId === g.id) {
                        setOverrideGameId(null);
                      } else {
                        setOverrideGameId(g.id);
                        setOverrideSets(
                          [0, 1, 2].map((i) => {
                            const s = g.sets?.[i];
                            return s ? { a: String(s.score_a), b: String(s.score_b) } : { a: "", b: "" };
                          })
                        );
                        setOverrideErrors([]);
                      }
                    }}
                    className="text-xs py-1"
                  >
                    {overrideGameId === g.id ? "Cancel" : "Override"}
                  </Button>
                </div>

                {overrideGameId === g.id && (
                  <div className="mt-2 space-y-2">
                    <div className="grid grid-cols-3 text-xs text-[#6b6b7a] mb-1">
                      <span>Set</span>
                      <span className="text-center">{squadAName}</span>
                      <span className="text-center">{squadBName}</span>
                    </div>
                    {overrideSets.map((row, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2 items-center">
                        <span className="text-xs text-[#6b6b7a]">Set {i + 1}</span>
                        <input
                          type="number"
                          min={0}
                          max={21}
                          value={row.a}
                          onChange={(e) => {
                            const next = [...overrideSets];
                            next[i] = { ...next[i], a: e.target.value };
                            setOverrideSets(next);
                          }}
                          className="w-full px-2 py-1 text-sm text-center rounded border border-[#1a1a24] bg-[#13131a] text-[#f0ece3] focus:outline-none"
                        />
                        <input
                          type="number"
                          min={0}
                          max={21}
                          value={row.b}
                          onChange={(e) => {
                            const next = [...overrideSets];
                            next[i] = { ...next[i], b: e.target.value };
                            setOverrideSets(next);
                          }}
                          className="w-full px-2 py-1 text-sm text-center rounded border border-[#1a1a24] bg-[#13131a] text-[#f0ece3] focus:outline-none"
                        />
                      </div>
                    ))}
                    {overrideErrors.map((e, i) => (
                      <p key={i} className="text-xs text-[#f87171]">{e}</p>
                    ))}
                    <Button
                      onClick={() => handleOverrideSubmit(g.id)}
                      loading={loading}
                      className="text-xs py-1.5 mt-1"
                    >
                      Save override
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
