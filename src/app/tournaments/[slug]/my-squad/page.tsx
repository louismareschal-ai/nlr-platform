import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CompositionForm } from "@/components/composition/CompositionForm";
import { ScoreEntry } from "@/components/scoring/ScoreEntry";
import type { GameSet, ScoreStatus } from "@/types";

export default async function MySquadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("role, squad_id")
    .eq("id", user.id)
    .single();

  if (!me || (me.role !== "squad_admin" && me.role !== "super_admin")) {
    redirect(`/tournaments/${slug}/bracket`);
  }

  const serviceClient = createServiceClient();
  const { data: tournament } = await serviceClient
    .from("tournaments")
    .select("id, name, status")
    .eq("slug", slug)
    .single();

  if (!tournament) notFound();

  if (!me.squad_id) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>My Squad</h1>
        <Card><p className="text-sm text-[#6b6b7a]">You are not linked to a squad in this tournament.</p></Card>
      </div>
    );
  }

  // Verify squad is in this tournament
  const { data: squad } = await supabase
    .from("squads")
    .select("id, name, seed")
    .eq("id", me.squad_id)
    .eq("tournament_id", tournament.id)
    .single();

  if (!squad) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>My Squad</h1>
        <Card><p className="text-sm text-[#6b6b7a]">Your squad is not in this tournament.</p></Card>
      </div>
    );
  }

  // Find active encounter (composition or scoring phase)
  const { data: activeEncounters } = await supabase
    .from("encounters")
    .select(`
      id, status, squad_a_id, squad_b_id,
      squad_a_composition_submitted, squad_b_composition_submitted,
      squad_a:squads!encounters_squad_a_id_fkey(id, name),
      squad_b:squads!encounters_squad_b_id_fkey(id, name),
      games(id, game_type, encounter_round, score_status, score_entered_by, score_confirmed_by, winner_squad_id, sets, courts(name, number))
    `)
    .or(`squad_a_id.eq.${squad.id},squad_b_id.eq.${squad.id}`)
    .not("status", "in", '("pending","completed")')
    .limit(1);

  const encounter = activeEncounters?.[0];

  const isA = encounter?.squad_a_id === squad.id;
  const opponent = encounter
    ? (isA ? encounter.squad_b : encounter.squad_a) as unknown as { id: string; name: string }
    : null;

  const games = (encounter?.games ?? []) as unknown as Array<{
    id: string;
    game_type: string;
    encounter_round: number;
    score_status: ScoreStatus;
    score_entered_by: string | null;
    score_confirmed_by: string | null;
    winner_squad_id: string | null;
    sets: GameSet[];
    courts: { name: string; number: number } | null;
  }>;

  const squadA = encounter ? (encounter.squad_a as unknown as { id: string; name: string }) : null;
  const squadB = encounter ? (encounter.squad_b as unknown as { id: string; name: string }) : null;

  const confirmedGames = games.filter((g) => g.score_status === "confirmed");
  const winsA = confirmedGames.filter((g) => g.winner_squad_id === squadA?.id).length;
  const winsB = confirmedGames.filter((g) => g.winner_squad_id === squadB?.id).length;

  const round1 = games.filter((g) => g.encounter_round === 1);
  const round2 = games.filter((g) => g.encounter_round === 2);

  // Composition page data
  const alreadySubmitted = encounter
    ? (isA ? encounter.squad_a_composition_submitted : encounter.squad_b_composition_submitted)
    : false;

  const { data: players } = encounter && encounter.status === "composition"
    ? await supabase
        .from("players")
        .select("*, player_tournament_points(*)")
        .eq("squad_id", squad.id)
    : { data: null };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">My Squad</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          {squad.name}{squad.seed ? ` · Seed ${squad.seed}` : ""}
        </h1>
      </div>

      {!encounter && (
        <Card>
          <p className="text-sm text-[#6b6b7a]">No active encounter right now. Check back when the next round starts.</p>
        </Card>
      )}

      {encounter && (
        <div className="space-y-5">
          {/* Encounter header */}
          <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6b6b7a] mb-0.5">Current encounter</p>
                <p className="font-semibold">{squad.name} vs {opponent?.name ?? "TBD"}</p>
              </div>
              <Badge variant={encounter.status === "composition" ? "warning" : "success"}>
                {encounter.status.replace("_", " ")}
              </Badge>
            </div>
          </div>

          {/* Composition phase */}
          {encounter.status === "composition" && players && (
            <CompositionForm
              encounterId={encounter.id}
              squadId={squad.id}
              players={players as Parameters<typeof CompositionForm>[0]["players"]}
            />
          )}

          {/* Scoring phase — score summary + game entry */}
          {encounter.status !== "composition" && games.length > 0 && (
            <>
              {/* Score summary */}
              <div className="rounded-xl border border-[#e8b84b]/20 bg-[#13131a] p-4">
                <div className="flex items-center justify-around">
                  <div className="text-center">
                    <p className="text-xs text-[#6b6b7a] mb-1">{squadA?.name}</p>
                    <p className={`text-5xl font-bold ${winsA >= 3 ? "text-[#e8b84b]" : "text-[#f0ece3]"}`} style={{ fontFamily: "var(--font-display)" }}>
                      {winsA}
                    </p>
                  </div>
                  <span className="text-2xl text-[#1a1a24]">|</span>
                  <div className="text-center">
                    <p className="text-xs text-[#6b6b7a] mb-1">{squadB?.name}</p>
                    <p className={`text-5xl font-bold ${winsB >= 3 ? "text-[#e8b84b]" : "text-[#f0ece3]"}`} style={{ fontFamily: "var(--font-display)" }}>
                      {winsB}
                    </p>
                  </div>
                </div>
              </div>

              {round1.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">Round 1 — Mixed</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {round1.map((g) => (
                      <ScoreEntry
                        key={g.id}
                        game={g}
                        squadAId={squadA?.id ?? ""}
                        squadBId={squadB?.id ?? ""}
                        squadAName={squadA?.name ?? ""}
                        squadBName={squadB?.name ?? ""}
                        mySquadId={squad.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {round2.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">Round 2 — Open + Women</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {round2.map((g) => (
                      <ScoreEntry
                        key={g.id}
                        game={g}
                        squadAId={squadA?.id ?? ""}
                        squadBId={squadB?.id ?? ""}
                        squadAName={squadA?.name ?? ""}
                        squadBName={squadB?.name ?? ""}
                        mySquadId={squad.id}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
