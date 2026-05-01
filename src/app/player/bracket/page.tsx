import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BracketView } from "@/components/bracket/BracketView";
import { Card } from "@/components/ui/Card";
import type { BracketSlot } from "@/types";

export default async function PlayerBracketPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("squad_id, squads(tournament_id)")
    .eq("id", user.id)
    .single();

  const tournamentId = (me?.squads as unknown as { tournament_id: string } | null)?.tournament_id;

  if (!tournamentId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Bracket</h1>
        <Card><p className="text-sm text-[#6b6b7a]">Not linked to a tournament.</p></Card>
      </div>
    );
  }

  const { data: encounters } = await supabase
    .from("encounters")
    .select(`
      id, bracket_slot, winner_id, squad_a_id, squad_b_id, status,
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      rounds(name)
    `)
    .eq("tournament_id", tournamentId);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Player</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>Bracket</h1>
      </div>

      {(!encounters || encounters.length === 0) ? (
        <Card><p className="text-sm text-[#6b6b7a]">Bracket not yet available.</p></Card>
      ) : (
        <BracketView
          encounters={encounters.map((e) => ({
            ...e,
            bracket_slot: e.bracket_slot as BracketSlot,
            squad_a: e.squad_a as unknown as { name: string } | null,
            squad_b: e.squad_b as unknown as { name: string } | null,
            round: e.rounds as unknown as { name: string },
          }))}
        />
      )}
    </div>
  );
}
