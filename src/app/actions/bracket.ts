"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { BRACKET_PATHS, encounterWinner, gameWinner } from "@/lib/tournament/bracket";
import type { BracketSlot } from "@/types";

export async function advanceEncounter(
  encounterId: string
): Promise<{ success: boolean; error?: string }> {
  // Read with session client (anon RLS is fine for reads)
  const supabase = await createClient();
  // All writes need service role — encounters_write policy is super_admin only
  const serviceSupabase = createServiceClient();

  // Load encounter + all games
  const { data: encounter } = await supabase
    .from("encounters")
    .select(`
      id, bracket_slot, tournament_id, round_id,
      squad_a_id, squad_b_id, winner_id,
      games(id, score_status, winner_squad_id, sets)
    `)
    .eq("id", encounterId)
    .single();

  if (!encounter) return { success: false, error: "Encounter not found" };
  if (encounter.winner_id) return { success: true }; // already advanced

  const games = (encounter.games ?? []) as Array<{
    id: string;
    score_status: string;
    winner_squad_id: string | null;
    sets: Array<{ score_a: number; score_b: number }>;
  }>;

  // Check all 5 games are confirmed
  if (games.length < 5) {
    return { success: false, error: "Not all 5 games exist yet" };
  }

  const allConfirmed = games.every((g) => g.score_status === "confirmed");
  if (!allConfirmed) {
    return { success: false, error: "Not all games are confirmed" };
  }

  // Determine winner/loser from game results
  const gameResults = games.map((g) => {
    const w = gameWinner(g.sets);
    if (w === "a") return "a" as const;
    if (w === "b") return "b" as const;
    // Fall back to winner_squad_id if sets are missing
    if (g.winner_squad_id === encounter.squad_a_id) return "a" as const;
    if (g.winner_squad_id === encounter.squad_b_id) return "b" as const;
    return null;
  });

  const result = encounterWinner(gameResults);
  if (!result) return { success: false, error: "Could not determine encounter winner" };

  const winnerId = result === "a" ? encounter.squad_a_id : encounter.squad_b_id;
  const loserId = result === "a" ? encounter.squad_b_id : encounter.squad_a_id;

  // Mark encounter complete
  const { error: completeError } = await serviceSupabase
    .from("encounters")
    .update({
      winner_id: winnerId,
      loser_id: loserId,
      status: "completed",
    })
    .eq("id", encounterId);

  if (completeError) return { success: false, error: completeError.message };

  // Look up bracket paths
  const slot = encounter.bracket_slot as BracketSlot;
  const paths = BRACKET_PATHS[slot];
  if (!paths) return { success: true }; // terminal slot

  // Place winner in next slot (if any)
  if (paths.winner_to) {
    await placeSquadInSlot(serviceSupabase, encounter.tournament_id, paths.winner_to, winnerId);
  }

  // Place loser in next slot (if any)
  if (paths.loser_to) {
    await placeSquadInSlot(serviceSupabase, encounter.tournament_id, paths.loser_to, loserId);
  }

  return { success: true };
}

export async function createEncounterGames(
  encounterId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient();
  const gameTypes = [
    { game_type: "mixed1", encounter_round: 1 },
    { game_type: "mixed2", encounter_round: 1 },
    { game_type: "open1",  encounter_round: 2 },
    { game_type: "open2",  encounter_round: 2 },
    { game_type: "women",  encounter_round: 2 },
  ];
  const { error } = await supabase.from("games").insert(
    gameTypes.map((g) => ({
      encounter_id: encounterId,
      game_type: g.game_type,
      encounter_round: g.encounter_round,
      score_status: "pending",
      status: "pending",
    }))
  );
  if (error) return { success: false, error: error.message };
  return { success: true };
}

async function placeSquadInSlot(
  supabase: ReturnType<typeof createServiceClient>,
  tournamentId: string,
  slot: BracketSlot,
  squadId: string
) {
  // Find existing encounter for this slot
  const { data: existing } = await supabase
    .from("encounters")
    .select("id, squad_a_id, squad_b_id")
    .eq("tournament_id", tournamentId)
    .eq("bracket_slot", slot)
    .single();

  if (existing) {
    // Fill whichever slot is still empty
    const updateField = !existing.squad_a_id
      ? { squad_a_id: squadId }
      : { squad_b_id: squadId };

    await supabase
      .from("encounters")
      .update(updateField)
      .eq("id", existing.id);
  } else {
    // Find or create the next round
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id")
      .eq("tournament_id", tournamentId)
      .order("round_number", { ascending: false })
      .limit(1);

    let roundId = rounds?.[0]?.id;

    if (!roundId) {
      // Create a new round
      const { data: newRound } = await supabase
        .from("rounds")
        .insert({
          tournament_id: tournamentId,
          round_number: 2,
          name: "Semifinals / Placement",
          status: "pending",
        })
        .select("id")
        .single();
      roundId = newRound?.id;
    }

    if (!roundId) return;

    const slotLabels: Partial<Record<BracketSlot, string>> = {
      sf_winners_1: "Semifinal 1",
      sf_winners_2: "Semifinal 2",
      sf_placement_1: "5th–8th Semifinal 1",
      sf_placement_2: "5th–8th Semifinal 2",
      final: "Grand Final",
      third_place: "3rd Place",
      fifth_place: "5th Place",
      seventh_place: "7th Place",
    };

    // Create the encounter placeholder
    await supabase.from("encounters").insert({
      round_id: roundId,
      tournament_id: tournamentId,
      bracket_slot: slot,
      squad_a_id: squadId,
      squad_b_id: null,
      status: "pending",
      composition_revealed: false,
      squad_a_composition_submitted: false,
      squad_b_composition_submitted: false,
    });
  }
}
