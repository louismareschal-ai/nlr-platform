"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CompositionForm } from "@/components/composition/CompositionForm";
import { Card } from "@/components/ui/Card";
import type { PlayerPoints, Gender, UserRole } from "@/types";

interface EncounterCompositionProps {
  encounterId: string;
  squadId: string;
  myCompositionSubmitted: boolean;
  theirCompositionSubmitted: boolean;
  compositionRevealed: boolean;
  players: Array<{
    id: string;
    first_name: string;
    last_name: string;
    gender: Gender;
    squad_id: string | null;
    role: UserRole;
    temp_password_changed: boolean;
    playerzone_id: string | null;
    created_at: string;
    points: PlayerPoints | null;
  }>;
  squadAName: string;
  squadBName: string;
  revealedCompositions: {
    squadA: { squad_id: string; data: Record<string, string> } | null;
    squadB: { squad_id: string; data: Record<string, string> } | null;
  };
}

export function EncounterComposition({
  encounterId,
  squadId,
  myCompositionSubmitted: initialMine,
  theirCompositionSubmitted: initialTheirs,
  compositionRevealed: initialRevealed,
  players,
  squadAName,
  squadBName,
  revealedCompositions,
}: EncounterCompositionProps) {
  const router = useRouter();
  const [mine, setMine] = useState(initialMine);
  const [theirs, setTheirs] = useState(initialTheirs);
  const [revealed, setRevealed] = useState(initialRevealed);

  // Subscribe to realtime updates
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`composition:${encounterId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "encounters",
          filter: `id=eq.${encounterId}`,
        },
        (payload) => {
          const row = payload.new as {
            squad_a_id: string;
            squad_b_id: string;
            squad_a_composition_submitted: boolean;
            squad_b_composition_submitted: boolean;
            composition_revealed: boolean;
          };

          const isA = row.squad_a_id === squadId;
          setMine(isA ? row.squad_a_composition_submitted : row.squad_b_composition_submitted);
          setTheirs(isA ? row.squad_b_composition_submitted : row.squad_a_composition_submitted);

          if (row.composition_revealed && !revealed) {
            setRevealed(true);
            router.refresh();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId, squadId, revealed, router]);

  if (revealed) {
    // Compositions revealed — page will show them via server component after refresh
    return (
      <Card gold>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[#e8b84b] text-lg">!</span>
          <p className="font-semibold">Compositions revealed!</p>
        </div>
        <p className="text-sm text-[#6b6b7a]">
          Both squads have submitted. Compositions are now visible to everyone.
        </p>
      </Card>
    );
  }

  if (mine && !theirs) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#34d399]" />
          <p className="font-semibold text-sm">Composition submitted</p>
        </div>
        <p className="text-sm text-[#6b6b7a]">
          Waiting for the other squad to submit their composition...
        </p>
        <div className="mt-3 flex gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#34d399]" /> Your squad — submitted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#1a1a24] animate-pulse" /> Opponent — waiting
          </span>
        </div>
      </Card>
    );
  }

  if (!mine) {
    return (
      <div className="space-y-4">
        <div>
          <p className="label-overline mb-1">Composition Phase</p>
          <p className="text-sm text-[#6b6b7a]">
            Submit your squad composition before the encounter starts. Compositions are revealed simultaneously when both squads submit.
          </p>
          {theirs && (
            <p className="text-xs text-[#e8b84b] mt-1">
              The other squad has already submitted — submit quickly!
            </p>
          )}
        </div>
        <CompositionForm
          encounterId={encounterId}
          squadId={squadId}
          players={players}
          onSubmit={() => {
            setMine(true);
          }}
        />
      </div>
    );
  }

  return null;
}
