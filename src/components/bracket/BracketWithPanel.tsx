"use client";

import { useState, useCallback } from "react";
import { BracketView } from "./BracketView";
import { EncounterPanel } from "./EncounterPanel";
import type { BracketSlot } from "@/types";

interface GameResult {
  game_type: string;
  winner_squad_id: string | null;
  score_status: string;
}

interface EncounterCard {
  id: string;
  bracket_slot: BracketSlot;
  squad_a: { name: string } | null;
  squad_b: { name: string } | null;
  winner_id: string | null;
  squad_a_id: string | null;
  squad_b_id: string | null;
  status: string;
  round: { name: string };
  games?: GameResult[];
}

interface BracketWithPanelProps {
  encounters: EncounterCard[];
  userRole: string | null;
  mySquadId: string | null;
  manageLinkBase?: string;
}

export function BracketWithPanel({
  encounters,
  userRole,
  mySquadId,
  manageLinkBase,
}: BracketWithPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const close = useCallback(() => setSelectedId(null), []);

  return (
    <>
      <BracketView
        encounters={encounters}
        onSelectEncounter={setSelectedId}
      />
      <EncounterPanel
        encounterId={selectedId}
        userRole={userRole}
        mySquadId={mySquadId}
        manageLinkBase={manageLinkBase}
        onClose={close}
      />
    </>
  );
}
