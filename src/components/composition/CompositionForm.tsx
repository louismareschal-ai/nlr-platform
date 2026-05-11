"use client";

import { useState } from "react";
import { validateCompositionPoints } from "@/lib/tournament/bracket";
import { submitComposition } from "@/app/actions/compositions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Player, PlayerPoints } from "@/types";

interface PlayerWithPoints extends Player {
  points: PlayerPoints | null;
}

interface CompositionFormProps {
  encounterId: string;
  squadId: string;
  players: PlayerWithPoints[];
  onSubmit?: () => void;
}

type Slot =
  | "mixed1_man"
  | "mixed1_woman"
  | "mixed2_man"
  | "mixed2_woman"
  | "open1_p1"
  | "open1_p2"
  | "open2_p1"
  | "open2_p2";

export function CompositionForm({
  encounterId,
  squadId,
  players,
  onSubmit,
}: CompositionFormProps) {
  const men = players.filter((p) => p.gender === "man");
  const women = players.filter((p) => p.gender === "woman");

  const [selection, setSelection] = useState<Partial<Record<Slot, string>>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function getPlayer(id: string | undefined) {
    return players.find((p) => p.id === id);
  }

  function getPoints(id: string | undefined, type: "mixed" | "open" | "women") {
    const p = getPlayer(id);
    if (!p?.points) return 0;
    if (type === "mixed") return p.points.mixed_points;
    if (type === "open") return p.points.open_points;
    return p.points.women_points;
  }

  function set(slot: Slot, playerId: string) {
    setSelection((prev) => ({ ...prev, [slot]: playerId }));
  }

  function validate(): { valid: boolean; errors: string[] } {
    const errs: string[] = [];
    const required: Slot[] = [
      "mixed1_man", "mixed1_woman", "mixed2_man", "mixed2_woman",
      "open1_p1", "open1_p2", "open2_p1", "open2_p2",
    ];

    for (const slot of required) {
      if (!selection[slot]) {
        errs.push(`Please select a player for every slot.`);
        break;
      }
    }

    // Each man can play in at most one open game (mixed and open can overlap)
    const openMenSlots: Slot[] = ["open1_p1", "open1_p2", "open2_p1", "open2_p2"];
    const openMen = openMenSlots.map((s) => selection[s]).filter(Boolean);
    if (new Set(openMen).size !== openMen.length) {
      errs.push("Each man can only play in one open game.");
    }

    // Check for duplicate women
    const womenSlots: Slot[] = ["mixed1_woman", "mixed2_woman"];
    const selectedWomen = womenSlots.map((s) => selection[s]).filter(Boolean);
    if (new Set(selectedWomen).size !== selectedWomen.length) {
      errs.push("Each woman can only play in one mixed game.");
    }

    if (errs.length > 0) return { valid: false, errors: errs };

    // Points constraints
    const pointErrors = validateCompositionPoints({
      mixed1_man_mixed: getPoints(selection.mixed1_man, "mixed"),
      mixed1_woman_mixed: getPoints(selection.mixed1_woman, "mixed"),
      mixed2_man_mixed: getPoints(selection.mixed2_man, "mixed"),
      mixed2_woman_mixed: getPoints(selection.mixed2_woman, "mixed"),
      open1_p1_open: getPoints(selection.open1_p1, "open"),
      open1_p2_open: getPoints(selection.open1_p2, "open"),
      open2_p1_open: getPoints(selection.open2_p1, "open"),
      open2_p2_open: getPoints(selection.open2_p2, "open"),
    });

    return { valid: pointErrors.valid, errors: pointErrors.errors };
  }

  async function handleSubmit() {
    const { valid, errors: errs } = validate();
    setErrors(errs);
    if (!valid) return;

    setLoading(true);

    const result = await submitComposition(encounterId, squadId, {
      mixed1_man_id: selection.mixed1_man!,
      mixed1_woman_id: selection.mixed1_woman!,
      mixed2_man_id: selection.mixed2_man!,
      mixed2_woman_id: selection.mixed2_woman!,
      open1_player1_id: selection.open1_p1!,
      open1_player2_id: selection.open1_p2!,
      open2_player1_id: selection.open2_p1!,
      open2_player2_id: selection.open2_p2!,
    });

    if (!result.success) {
      setErrors(result.errors ?? [result.error ?? "Unknown error"]);
      setLoading(false);
      return;
    }

    onSubmit?.();
    setLoading(false);
  }

  function PlayerSelect({
    slot,
    pool,
    label,
  }: {
    slot: Slot;
    pool: PlayerWithPoints[];
    label: string;
  }) {
    return (
      <div>
        <label className="text-xs text-[#6b6b7a] block mb-1">{label}</label>
        <select
          value={selection[slot] ?? ""}
          onChange={(e) => set(slot, e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[#1a1a24] bg-[#13131a] text-sm text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
        >
          <option value="">Select player...</option>
          {pool.map((p) => (
            <option key={p.id} value={p.id}>
              {p.first_name} {p.last_name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const mixed1Total =
    getPoints(selection.mixed1_man, "mixed") +
    getPoints(selection.mixed1_woman, "mixed");
  const mixed2Total =
    getPoints(selection.mixed2_man, "mixed") +
    getPoints(selection.mixed2_woman, "mixed");
  const open1Total =
    getPoints(selection.open1_p1, "open") +
    getPoints(selection.open1_p2, "open");
  const open2Total =
    getPoints(selection.open2_p1, "open") +
    getPoints(selection.open2_p2, "open");

  return (
    <div className="space-y-4">
      {/* Mixed round */}
      <Card gold>
        <p className="label-overline mb-3">Round 1 — Mixed</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              Mixed 1{" "}
              <span className="text-xs text-[#6b6b7a] font-normal">
                ({mixed1Total} pts)
              </span>
            </p>
            <PlayerSelect slot="mixed1_man" pool={men} label="Man" />
            <PlayerSelect slot="mixed1_woman" pool={women} label="Woman" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              Mixed 2{" "}
              <span className={`text-xs font-normal ${mixed2Total > mixed1Total ? "text-[#f87171]" : "text-[#6b6b7a]"}`}>
                ({mixed2Total} pts)
              </span>
            </p>
            <PlayerSelect slot="mixed2_man" pool={men} label="Man" />
            <PlayerSelect slot="mixed2_woman" pool={women} label="Woman" />
          </div>
        </div>
        {mixed1Total < mixed2Total && (
          <p className="text-xs text-[#f87171] mt-2">
            Mixed 1 must have more mixed points than Mixed 2.
          </p>
        )}
      </Card>

      {/* Open + Women round */}
      <Card>
        <p className="label-overline mb-3">Round 2 — Open + Women</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              Open 1{" "}
              <span className="text-xs text-[#6b6b7a] font-normal">
                ({open1Total} pts)
              </span>
            </p>
            <PlayerSelect slot="open1_p1" pool={men} label="Player 1" />
            <PlayerSelect slot="open1_p2" pool={men} label="Player 2" />
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              Open 2{" "}
              <span className={`text-xs font-normal ${open2Total > open1Total ? "text-[#f87171]" : "text-[#6b6b7a]"}`}>
                ({open2Total} pts)
              </span>
            </p>
            <PlayerSelect slot="open2_p1" pool={men} label="Player 1" />
            <PlayerSelect slot="open2_p2" pool={men} label="Player 2" />
          </div>
        </div>
        {open1Total < open2Total && (
          <p className="text-xs text-[#f87171] mt-2">
            Open 1 must have more open points than Open 2.
          </p>
        )}
        <div className="border-t border-[#1a1a24] pt-4">
          <p className="text-sm font-semibold mb-2">Women</p>
          <div className="flex gap-2 flex-wrap">
            {women.map((w) => (
              <div
                key={w.id}
                className="px-3 py-1.5 rounded-lg bg-[#1a1a24] text-sm text-[#f0ece3]"
              >
                {w.first_name} {w.last_name}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#6b6b7a] mt-1">
            Both women always play the Women game.
          </p>
        </div>
      </Card>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-[#f87171]">{e}</p>
          ))}
        </div>
      )}

      <Button onClick={handleSubmit} loading={loading}>
        Submit composition
      </Button>
    </div>
  );
}
