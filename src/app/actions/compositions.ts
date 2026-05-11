"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { validateCompositionPoints } from "@/lib/tournament/bracket";

export async function enterRandomComposition(
  encounterId: string,
  squadId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const serviceSupabase = createServiceClient();

  const { data: encounter } = await serviceSupabase
    .from("encounters")
    .select("squad_a_id, squad_b_id, squad_a_composition_submitted, squad_b_composition_submitted, status")
    .eq("id", encounterId)
    .single();

  if (!encounter) return { success: false, error: "Encounter not found" };
  if (encounter.status !== "composition") return { success: false, error: "Not in composition phase" };

  // Fetch players in this squad with their points
  const { data: players } = await supabase
    .from("players")
    .select("id, gender, player_tournament_points(mixed_points, open_points)")
    .eq("squad_id", squadId);

  if (!players || players.length === 0) return { success: false, error: "No players found for this squad" };

  type PlayerWithPts = {
    id: string;
    gender: string;
    mixed_points: number;
    open_points: number;
  };

  const enriched: PlayerWithPts[] = players.map((p) => {
    const pts = (p.player_tournament_points as unknown as Array<{ mixed_points: number; open_points: number }>)?.[0];
    return { id: p.id, gender: p.gender, mixed_points: pts?.mixed_points ?? 0, open_points: pts?.open_points ?? 0 };
  });

  const men = enriched.filter((p) => p.gender === "man").sort((a, b) => b.mixed_points - a.mixed_points);
  const women = enriched.filter((p) => p.gender === "woman").sort((a, b) => b.mixed_points - a.mixed_points);
  const menByOpen = [...enriched.filter((p) => p.gender === "man")].sort((a, b) => b.open_points - a.open_points);

  if (men.length < 2) return { success: false, error: "Need at least 2 men in squad" };
  if (women.length < 2) return { success: false, error: "Need at least 2 women in squad" };
  if (menByOpen.length < 4) return { success: false, error: "Need at least 4 men for open games" };

  const data = {
    mixed1_man_id: men[0].id,
    mixed1_woman_id: women[0].id,
    mixed2_man_id: men[1].id,
    mixed2_woman_id: women[1].id,
    open1_player1_id: menByOpen[0].id,
    open1_player2_id: menByOpen[1].id,
    open2_player1_id: menByOpen[2].id,
    open2_player2_id: menByOpen[3].id,
  };

  const { error: compError } = await serviceSupabase.from("compositions").upsert(
    { encounter_id: encounterId, squad_id: squadId, ...data, submitted_at: new Date().toISOString() },
    { onConflict: "encounter_id,squad_id" }
  );
  if (compError) return { success: false, error: compError.message };

  const isSquadA = encounter.squad_a_id === squadId;
  const otherAlreadySubmitted = isSquadA
    ? encounter.squad_b_composition_submitted
    : encounter.squad_a_composition_submitted;

  const updatePayload: Record<string, boolean> = isSquadA
    ? { squad_a_composition_submitted: true }
    : { squad_b_composition_submitted: true };

  if (otherAlreadySubmitted) updatePayload.composition_revealed = true;

  const { error: updateError } = await serviceSupabase
    .from("encounters")
    .update(updatePayload)
    .eq("id", encounterId);

  if (updateError) return { success: false, error: updateError.message };

  return { success: true };
}

export interface CompositionData {
  mixed1_man_id: string;
  mixed1_woman_id: string;
  mixed2_man_id: string;
  mixed2_woman_id: string;
  open1_player1_id: string;
  open1_player2_id: string;
  open2_player1_id: string;
  open2_player2_id: string;
}

export async function submitComposition(
  encounterId: string,
  squadId: string,
  data: CompositionData
): Promise<{ success: boolean; error?: string; errors?: string[] }> {
  const supabase = await createClient();

  // Verify the user is authenticated and belongs to this squad
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { data: me } = await supabase
    .from("players")
    .select("squad_id, role")
    .eq("id", user.id)
    .single();

  if (!me || (me.squad_id !== squadId && me.role !== "super_admin")) {
    return { success: false, error: "Not authorized for this squad" };
  }

  // Load the encounter
  const { data: encounter } = await supabase
    .from("encounters")
    .select("status, squad_a_id, squad_b_id, squad_a_composition_submitted, squad_b_composition_submitted")
    .eq("id", encounterId)
    .single();

  if (!encounter) return { success: false, error: "Encounter not found" };
  if (encounter.status !== "composition") {
    return { success: false, error: "Encounter is not in composition phase" };
  }

  // Check if this squad already submitted
  const isSquadA = encounter.squad_a_id === squadId;
  const isSquadB = encounter.squad_b_id === squadId;
  if (!isSquadA && !isSquadB) {
    return { success: false, error: "Squad is not part of this encounter" };
  }

  const alreadySubmitted = isSquadA
    ? encounter.squad_a_composition_submitted
    : encounter.squad_b_composition_submitted;

  if (alreadySubmitted) {
    return { success: false, error: "Composition already submitted" };
  }

  // Use service client for writes — auth check above is sufficient
  const serviceSupabase = createServiceClient();

  // Load points for all players in the composition
  const playerIds = [
    data.mixed1_man_id,
    data.mixed1_woman_id,
    data.mixed2_man_id,
    data.mixed2_woman_id,
    data.open1_player1_id,
    data.open1_player2_id,
    data.open2_player1_id,
    data.open2_player2_id,
  ];

  const { data: pointsRows } = await supabase
    .from("player_tournament_points")
    .select("player_id, mixed_points, open_points, women_points")
    .in("player_id", playerIds);

  function getPoints(pid: string, type: "mixed" | "open"): number {
    const row = pointsRows?.find((p) => p.player_id === pid);
    if (!row) return 0;
    return type === "mixed" ? row.mixed_points : row.open_points;
  }

  // Validate points constraints
  const { valid, errors } = validateCompositionPoints({
    mixed1_man_mixed: getPoints(data.mixed1_man_id, "mixed"),
    mixed1_woman_mixed: getPoints(data.mixed1_woman_id, "mixed"),
    mixed2_man_mixed: getPoints(data.mixed2_man_id, "mixed"),
    mixed2_woman_mixed: getPoints(data.mixed2_woman_id, "mixed"),
    open1_p1_open: getPoints(data.open1_player1_id, "open"),
    open1_p2_open: getPoints(data.open1_player2_id, "open"),
    open2_p1_open: getPoints(data.open2_player1_id, "open"),
    open2_p2_open: getPoints(data.open2_player2_id, "open"),
  });

  if (!valid) return { success: false, errors };

  // Validate no duplicate men in open games
  const openMen = [
    data.open1_player1_id,
    data.open1_player2_id,
    data.open2_player1_id,
    data.open2_player2_id,
  ];
  if (new Set(openMen).size !== openMen.length) {
    return { success: false, errors: ["Each man can only play in one open game."] };
  }

  // Insert or update composition
  const { error: compError } = await serviceSupabase.from("compositions").upsert(
    {
      encounter_id: encounterId,
      squad_id: squadId,
      mixed1_man_id: data.mixed1_man_id,
      mixed1_woman_id: data.mixed1_woman_id,
      mixed2_man_id: data.mixed2_man_id,
      mixed2_woman_id: data.mixed2_woman_id,
      open1_player1_id: data.open1_player1_id,
      open1_player2_id: data.open1_player2_id,
      open2_player1_id: data.open2_player1_id,
      open2_player2_id: data.open2_player2_id,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "encounter_id,squad_id" }
  );

  if (compError) return { success: false, error: compError.message };

  // Mark composition submitted — if the other squad already submitted, reveal in the same update
  const otherAlreadySubmitted = isSquadA
    ? encounter.squad_b_composition_submitted
    : encounter.squad_a_composition_submitted;

  const updatePayload: Record<string, boolean> = isSquadA
    ? { squad_a_composition_submitted: true }
    : { squad_b_composition_submitted: true };

  if (otherAlreadySubmitted) {
    updatePayload.composition_revealed = true;
  }

  const { error: updateError } = await serviceSupabase
    .from("encounters")
    .update(updatePayload)
    .eq("id", encounterId);

  if (updateError) return { success: false, error: updateError.message };

  return { success: true };
}
