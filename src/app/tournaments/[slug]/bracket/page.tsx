import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BracketWithPanel } from "@/components/bracket/BracketWithPanel";
import { Card } from "@/components/ui/Card";
import type { BracketSlot } from "@/types";

export default async function TournamentBracketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const serviceClient = createServiceClient();

  const { data: tournament } = await serviceClient
    .from("tournaments")
    .select("id, name, status")
    .eq("slug", slug)
    .single();

  if (!tournament) notFound();

  const { data: encounters } = await serviceClient
    .from("encounters")
    .select(`
      id, bracket_slot, winner_id, squad_a_id, squad_b_id, status,
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      rounds(name),
      games(game_type, winner_squad_id, score_status)
    `)
    .eq("tournament_id", tournament.id);

  // Auth for panel role-based actions
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role: string | null = null;
  let mySquadId: string | null = null;

  if (user) {
    const { data: player } = await supabase
      .from("players")
      .select("role, squad_id")
      .eq("id", user.id)
      .single();
    role = player?.role ?? null;
    mySquadId = player?.squad_id ?? null;
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="label-overline">{tournament.status === "active" ? "Live" : tournament.status}</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          {tournament.name}
        </h1>
      </div>

      {(!encounters || encounters.length === 0) ? (
        <Card>
          <p className="text-sm text-[#6b6b7a]">Bracket not yet generated.</p>
        </Card>
      ) : (
        <BracketWithPanel
          encounters={(encounters ?? []).map((e) => ({
            ...e,
            bracket_slot: e.bracket_slot as BracketSlot,
            squad_a: e.squad_a as unknown as { name: string } | null,
            squad_b: e.squad_b as unknown as { name: string } | null,
            round: e.rounds as unknown as { name: string },
            games: (e.games ?? []) as Array<{ game_type: string; winner_squad_id: string | null; score_status: string }>,
          }))}
          userRole={role}
          mySquadId={mySquadId}
          manageLinkBase={role === "super_admin" ? `/tournaments/${slug}/manage` : undefined}
        />
      )}
    </div>
  );
}
