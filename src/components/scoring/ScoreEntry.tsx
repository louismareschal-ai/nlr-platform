"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isValidSetScore, gameWinner } from "@/lib/tournament/bracket";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { GameSet, ScoreStatus } from "@/types";

interface ScoreEntryProps {
  game: {
    id: string;
    game_type: string;
    sets: GameSet[];
    score_status: ScoreStatus;
    score_entered_by: string | null;
    winner_squad_id: string | null;
  };
  squadAId: string;
  squadBId: string;
  squadAName: string;
  squadBName: string;
  mySquadId: string;
  onUpdate?: () => void;
}

export function ScoreEntry({
  game,
  squadAId,
  squadBId,
  squadAName,
  squadBName,
  mySquadId,
  onUpdate,
}: ScoreEntryProps) {
  // Local draft of sets being entered
  const [draft, setDraft] = useState<{ a: string; b: string }[]>([
    { a: "", b: "" },
    { a: "", b: "" },
    { a: "", b: "" },
  ]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const isSubmitted = game.score_status === "submitted";
  const isConfirmed = game.score_status === "confirmed";
  const iEnteredIt = game.score_entered_by === mySquadId;
  const otherSquadEntered = isSubmitted && !iEnteredIt;
  const canConfirm = otherSquadEntered && !isConfirmed;
  const canEnter = game.score_status === "pending" && !isConfirmed;
  const canEdit = isSubmitted && !iEnteredIt;

  function parseDraftSets(): { valid: boolean; sets: GameSet[]; errors: string[] } {
    const errs: string[] = [];
    const sets: GameSet[] = [];

    let winsA = 0;
    let winsB = 0;

    for (let i = 0; i < 3; i++) {
      const a = parseInt(draft[i].a);
      const b = parseInt(draft[i].b);

      // Stop once someone has 2 wins
      if (winsA >= 2 || winsB >= 2) break;

      if (isNaN(a) || isNaN(b)) {
        if (i < 2) {
          errs.push(`Set ${i + 1}: both scores are required.`);
        }
        break;
      }

      if (!isValidSetScore(a, b)) {
        errs.push(
          `Set ${i + 1}: ${a}-${b} is not a valid score. Games go to 15 (win by 2). Hard cap 21-20.`
        );
        break;
      }

      sets.push({ set_number: (i + 1) as 1 | 2 | 3, score_a: a, score_b: b });
      if (a > b) winsA++;
      else winsB++;
    }

    if (sets.length > 0 && winsA < 2 && winsB < 2) {
      errs.push("The game is not finished — one team needs 2 set wins.");
    }

    return { valid: errs.length === 0, sets, errors: errs };
  }

  async function handleSubmit() {
    const { valid, sets, errors: errs } = parseDraftSets();
    setErrors(errs);
    if (!valid) return;

    setLoading(true);
    const supabase = createClient();

    const winner = gameWinner(sets.map((s) => ({ score_a: s.score_a, score_b: s.score_b })));
    const winner_squad_id = winner === "a" ? squadAId : winner === "b" ? squadBId : null;

    const { error } = await supabase
      .from("games")
      .update({
        sets: sets,
        score_entered_by: mySquadId,
        score_entered_at: new Date().toISOString(),
        score_status: "submitted",
        winner_squad_id,
        score_confirmed_by: null,
        score_confirmed_at: null,
      })
      .eq("id", game.id);

    if (error) {
      setErrors([error.message]);
    } else {
      setEditing(false);
      onUpdate?.();
    }
    setLoading(false);
  }

  async function handleConfirm() {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from("games")
      .update({
        score_status: "confirmed",
        score_confirmed_by: mySquadId,
        score_confirmed_at: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", game.id);

    if (error) {
      setErrors([error.message]);
    } else {
      onUpdate?.();
    }
    setLoading(false);
  }

  async function handleDispute() {
    // Switch to editing mode — they'll submit a new score
    setEditing(true);
    if (game.sets.length > 0) {
      setDraft(
        [0, 1, 2].map((i) => {
          const s = game.sets[i];
          return s ? { a: String(s.score_a), b: String(s.score_b) } : { a: "", b: "" };
        })
      );
    }
  }

  const gameLabel = game.game_type.replace(/(\d)/, " $1").replace(/^./, (c) => c.toUpperCase());

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{gameLabel}</h3>
        <Badge
          variant={
            isConfirmed ? "success" : isSubmitted ? "warning" : "neutral"
          }
        >
          {isConfirmed ? "Confirmed" : isSubmitted ? "Awaiting confirmation" : "Not entered"}
        </Badge>
      </div>

      {/* Existing score display */}
      {game.sets.length > 0 && !editing && (
        <div className="mb-3 space-y-1">
          <div className="grid grid-cols-3 text-xs text-[#6b6b7a] mb-1">
            <span>Set</span>
            <span className="text-center">{squadAName}</span>
            <span className="text-center">{squadBName}</span>
          </div>
          {game.sets.map((s) => {
            const aWon = s.score_a > s.score_b;
            return (
              <div key={s.set_number} className="grid grid-cols-3 text-sm">
                <span className="text-[#6b6b7a]">Set {s.set_number}</span>
                <span className={`text-center font-medium ${aWon ? "text-[#34d399]" : ""}`}>
                  {s.score_a}
                </span>
                <span className={`text-center font-medium ${!aWon ? "text-[#34d399]" : ""}`}>
                  {s.score_b}
                </span>
              </div>
            );
          })}
          {game.winner_squad_id && (
            <p className="text-xs text-[#6b6b7a] mt-2">
              Winner:{" "}
              <span className="text-[#e8b84b] font-medium">
                {game.winner_squad_id === squadAId ? squadAName : squadBName}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Score input form */}
      {(editing || (canEnter && game.sets.length === 0)) && (
        <div className="space-y-2 mb-3">
          <div className="grid grid-cols-3 text-xs text-[#6b6b7a] mb-1">
            <span>Set</span>
            <span className="text-center">{squadAName}</span>
            <span className="text-center">{squadBName}</span>
          </div>
          {draft.map((row, i) => (
            <div key={i} className="grid grid-cols-3 gap-2 items-center">
              <span className="text-sm text-[#6b6b7a]">Set {i + 1}</span>
              <input
                type="number"
                min={0}
                max={21}
                value={row.a}
                onChange={(e) => {
                  const next = [...draft];
                  next[i] = { ...next[i], a: e.target.value };
                  setDraft(next);
                }}
                className="w-full px-2 py-1.5 text-sm text-center rounded-lg border border-[#1a1a24] bg-[#13131a] text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
                placeholder="—"
              />
              <input
                type="number"
                min={0}
                max={21}
                value={row.b}
                onChange={(e) => {
                  const next = [...draft];
                  next[i] = { ...next[i], b: e.target.value };
                  setDraft(next);
                }}
                className="w-full px-2 py-1.5 text-sm text-center rounded-lg border border-[#1a1a24] bg-[#13131a] text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
                placeholder="—"
              />
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <div className="mb-3 space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-[#f87171]">{err}</p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        {(canEnter || editing) && !isConfirmed && (
          <Button onClick={handleSubmit} loading={loading} className="text-xs py-1.5">
            {editing ? "Submit correction" : "Enter score"}
          </Button>
        )}
        {editing && (
          <Button variant="ghost" onClick={() => { setEditing(false); setErrors([]); }} className="text-xs py-1.5">
            Cancel
          </Button>
        )}
        {canConfirm && !editing && (
          <>
            <Button variant="secondary" onClick={handleConfirm} loading={loading} className="text-xs py-1.5">
              Confirm score
            </Button>
            <Button variant="danger" onClick={handleDispute} className="text-xs py-1.5">
              Dispute
            </Button>
          </>
        )}
        {iEnteredIt && isSubmitted && (
          <p className="text-xs text-[#6b6b7a] self-center">
            Waiting for {squadAId === mySquadId ? squadBName : squadAName} to confirm
          </p>
        )}
        {isConfirmed && (
          <p className="text-xs text-[#34d399]">Score locked</p>
        )}
      </div>
    </Card>
  );
}
