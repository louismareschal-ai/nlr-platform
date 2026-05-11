import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ScoreEntry } from "@/components/scoring/ScoreEntry";
import type { GameSet, ScoreStatus } from "@/types";

export default async function PlayerScoresPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("squad_id, first_name, last_name")
    .eq("id", user.id)
    .single();

  const squadId = me?.squad_id;

  if (!squadId) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Live Scores
        </h1>
        <p className="text-sm text-[#6b6b7a]">You are not linked to a squad.</p>
      </div>
    );
  }

  // Find the squad's active encounter
  const { data: encounters } = await supabase
    .from("encounters")
    .select(`
      id, status, squad_a_id, squad_b_id,
      squad_a:squads!encounters_squad_a_id_fkey(id, name),
      squad_b:squads!encounters_squad_b_id_fkey(id, name),
      rounds(name, scheduled_start),
      games(id, game_type, encounter_round, score_status, score_entered_by, score_confirmed_by, winner_squad_id, sets, courts(name, number))
    `)
    .or(`squad_a_id.eq.${squadId},squad_b_id.eq.${squadId}`)
    .not("status", "in", '("pending","completed")')
    .limit(1);

  const encounter = encounters?.[0];

  if (!encounter) {
    return (
      <div className="space-y-4">
        <p className="label-overline">Player</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          Live Scores
        </h1>
        <Card>
          <p className="text-sm text-[#6b6b7a]">
            No active encounter right now. Check back when your match starts.
          </p>
        </Card>
      </div>
    );
  }

  const squadA = encounter.squad_a as unknown as { id: string; name: string };
  const squadB = encounter.squad_b as unknown as { id: string; name: string };
  const round = encounter.rounds as unknown as { name: string; scheduled_start: string | null } | null;
  const games = (encounter.games ?? []) as unknown as Array<{
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

  const round1Games = games.filter((g) => g.encounter_round === 1);
  const round2Games = games.filter((g) => g.encounter_round === 2);

  const winsA = games.filter(
    (g) => g.score_status === "confirmed" && g.winner_squad_id === squadA.id
  ).length;
  const winsB = games.filter(
    (g) => g.score_status === "confirmed" && g.winner_squad_id === squadB.id
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">{round?.name ?? "Current Encounter"}</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          {squadA.name} vs {squadB.name}
        </h1>
        {round?.scheduled_start && (
          <p className="text-sm text-[#6b6b7a] mt-0.5">
            {new Date(round.scheduled_start).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>

      {/* Score summary */}
      <div className="rounded-xl border border-[#e8b84b]/20 bg-[#13131a] p-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-sm text-[#6b6b7a]">{squadA.name}</p>
            <p
              className={`text-4xl font-bold ${winsA >= 3 ? "text-[#e8b84b]" : "text-[#f0ece3]"}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {winsA}
            </p>
          </div>
          <span className="text-xl text-[#6b6b7a]">—</span>
          <div className="text-center">
            <p className="text-sm text-[#6b6b7a]">{squadB.name}</p>
            <p
              className={`text-4xl font-bold ${winsB >= 3 ? "text-[#e8b84b]" : "text-[#f0ece3]"}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {winsB}
            </p>
          </div>
        </div>
      </div>

      {/* Game scores — read only for players (they can still enter if squad admin) */}
      {round1Games.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">
            Round 1 — Mixed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {round1Games.map((g) => (
              <ScoreEntry
                key={g.id}
                game={g}
                squadAId={squadA.id}
                squadBId={squadB.id}
                squadAName={squadA.name}
                squadBName={squadB.name}
                mySquadId=""
              />
            ))}
          </div>
        </section>
      )}

      {round2Games.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">
            Round 2 — Open + Women
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {round2Games.map((g) => (
              <ScoreEntry
                key={g.id}
                game={g}
                squadAId={squadA.id}
                squadBId={squadB.id}
                squadAName={squadA.name}
                squadBName={squadB.name}
                mySquadId=""
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
