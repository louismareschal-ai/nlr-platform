"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidSetScore, gameWinner } from "@/lib/tournament/bracket";
import { advanceEncounter } from "@/app/actions/bracket";
import type { GameSet } from "@/types";

async function getMySquadId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("players")
    .select("squad_id, role")
    .eq("id", user.id)
    .single();

  // Super admins bypass squad check — return empty string as sentinel
  if (data?.role === "super_admin") return "__super_admin__";
  return data?.squad_id ?? null;
}

export async function submitScore(
  gameId: string,
  sets: GameSet[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const mySquadId = await getMySquadId(supabase);
  if (!mySquadId) return { success: false, error: "Not authenticated" };

  // Validate sets
  let winsA = 0;
  let winsB = 0;
  for (const s of sets) {
    if (!isValidSetScore(s.score_a, s.score_b)) {
      return {
        success: false,
        error: `Set ${s.set_number}: ${s.score_a}-${s.score_b} is not a valid score.`,
      };
    }
    if (s.score_a > s.score_b) winsA++;
    else winsB++;
  }

  if (winsA < 2 && winsB < 2) {
    return { success: false, error: "Game not finished — one team needs 2 set wins." };
  }

  // Load game to verify it's in a pending/disputed state
  const { data: game } = await supabase
    .from("games")
    .select("id, score_status, encounter_id, encounters(squad_a_id, squad_b_id)")
    .eq("id", gameId)
    .single();

  if (!game) return { success: false, error: "Game not found" };
  if (game.score_status === "confirmed") {
    return { success: false, error: "Score already confirmed" };
  }

  const winner = gameWinner(sets.map((s) => ({ score_a: s.score_a, score_b: s.score_b })));
  const encounter = game.encounters as unknown as { squad_a_id: string; squad_b_id: string } | null;
  const winner_squad_id =
    winner === "a"
      ? encounter?.squad_a_id ?? null
      : winner === "b"
      ? encounter?.squad_b_id ?? null
      : null;

  const enteredBy = mySquadId === "__super_admin__" ? null : mySquadId;

  const { error } = await supabase
    .from("games")
    .update({
      sets,
      score_entered_by: enteredBy,
      score_entered_at: new Date().toISOString(),
      score_status: "submitted",
      winner_squad_id,
      score_confirmed_by: null,
      score_confirmed_at: null,
    })
    .eq("id", gameId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function confirmScore(
  gameId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const mySquadId = await getMySquadId(supabase);
  if (!mySquadId) return { success: false, error: "Not authenticated" };

  const { data: game, error: fetchError } = await supabase
    .from("games")
    .select("encounter_id")
    .eq("id", gameId)
    .single();

  if (fetchError) return { success: false, error: fetchError.message };

  const { error } = await supabase
    .from("games")
    .update({
      score_status: "confirmed",
      score_confirmed_by: mySquadId === "__super_admin__" ? null : mySquadId,
      score_confirmed_at: new Date().toISOString(),
      status: "completed",
    })
    .eq("id", gameId);

  if (error) return { success: false, error: error.message };

  // Attempt to auto-advance the encounter; it's a no-op if not all games are confirmed yet
  if (game?.encounter_id) await advanceEncounter(game.encounter_id);

  return { success: true };
}

export async function disputeScore(
  gameId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const mySquadId = await getMySquadId(supabase);
  if (!mySquadId) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("games")
    .update({
      score_status: "disputed",
    })
    .eq("id", gameId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
