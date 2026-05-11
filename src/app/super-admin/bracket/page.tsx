import { createClient } from "@/lib/supabase/server";
import { BracketView } from "@/components/bracket/BracketView";
import { Card } from "@/components/ui/Card";
import type { BracketSlot } from "@/types";

export default async function SuperAdminBracketPage() {
  const supabase = await createClient();

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, status")
    .in("status", ["active", "registration"])
    .order("date", { ascending: false })
    .limit(1);

  const tournament = tournaments?.[0];

  if (!tournament) {
    return (
      <div className="space-y-4">
        <p className="label-overline">Bracket</p>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Bracket
        </h1>
        <Card>
          <p className="text-sm text-[#6b6b7a]">No active tournament. Activate one from the Tournaments page.</p>
        </Card>
      </div>
    );
  }

  const { data: encounters } = await supabase
    .from("encounters")
    .select(`
      id, bracket_slot, winner_id, squad_a_id, squad_b_id, status,
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      rounds(name),
      games(game_type, winner_squad_id, score_status)
    `)
    .eq("tournament_id", tournament.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Super Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          Bracket — {tournament.name}
        </h1>
      </div>

      {(!encounters || encounters.length === 0) ? (
        <Card>
          <p className="text-sm text-[#6b6b7a]">
            No encounters generated yet. Go to the tournament setup page to add squads and generate the bracket.
          </p>
        </Card>
      ) : (
        <BracketView
          encounters={encounters.map((e) => ({
            ...e,
            bracket_slot: e.bracket_slot as BracketSlot,
            squad_a: e.squad_a as unknown as { name: string } | null,
            squad_b: e.squad_b as unknown as { name: string } | null,
            round: e.rounds as unknown as { name: string },
            games: (e.games ?? []) as Array<{ game_type: string; winner_squad_id: string | null; score_status: string }>,
          }))}
          linkPrefix="/super-admin/encounters"
        />
      )}
    </div>
  );
}
