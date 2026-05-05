import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ScoreEntry } from "@/components/scoring/ScoreEntry";
import type { GameSet, ScoreStatus } from "@/types";

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("squad_id")
    .eq("id", user.id)
    .single();

  const { data: encounter } = await supabase
    .from("encounters")
    .select(`
      id, status, squad_a_id, squad_b_id,
      squad_a:squads!encounters_squad_a_id_fkey(id, name),
      squad_b:squads!encounters_squad_b_id_fkey(id, name),
      rounds(name, scheduled_start),
      games(id, game_type, encounter_round, score_status, score_entered_by, score_confirmed_by, winner_squad_id, sets, courts(name, number))
    `)
    .eq("id", id)
    .single();

  if (!encounter) notFound();

  const squadA = encounter.squad_a as unknown as { id: string; name: string };
  const squadB = encounter.squad_b as unknown as { id: string; name: string };
  const round = encounter.rounds as unknown as { name: string; scheduled_start: string | null } | null;
  const games = encounter.games as unknown as Array<{
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

  const mySquadId = me?.squad_id ?? "";
  const round1Games = games.filter((g) => g.encounter_round === 1);
  const round2Games = games.filter((g) => g.encounter_round === 2);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">{round?.name ?? "Encounter"}</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          {squadA.name} vs {squadB.name}
        </h1>
        {round?.scheduled_start && (
          <p className="text-sm text-[#6b6b7a] mt-0.5">
            {new Date(round.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      {round1Games.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 text-[#6b6b7a] uppercase tracking-wide text-xs">Round 1 — Mixed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {round1Games.map((g) => (
              <ScoreEntry
                key={g.id}
                game={g}
                squadAId={squadA.id}
                squadBId={squadB.id}
                squadAName={squadA.name}
                squadBName={squadB.name}
                mySquadId={mySquadId}
              />
            ))}
          </div>
        </section>
      )}

      {round2Games.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 text-[#6b6b7a] uppercase tracking-wide text-xs">Round 2 — Open + Women</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {round2Games.map((g) => (
              <ScoreEntry
                key={g.id}
                game={g}
                squadAId={squadA.id}
                squadBId={squadB.id}
                squadAName={squadA.name}
                squadBName={squadB.name}
                mySquadId={mySquadId}
              />
            ))}
          </div>
        </section>
      )}

      {games.length === 0 && (
        <Card>
          <p className="text-sm text-[#6b6b7a]">
            Games will appear here once the encounter starts and compositions are submitted.
          </p>
        </Card>
      )}
    </div>
  );
}
