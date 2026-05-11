import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ScoreEntry } from "@/components/scoring/ScoreEntry";
import { EncounterComposition } from "./EncounterComposition";
import type { GameSet, ScoreStatus, PlayerPoints, Gender, UserRole } from "@/types";

export default async function EncounterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
      squad_a_composition_submitted, squad_b_composition_submitted, composition_revealed,
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
  const round = encounter.rounds as unknown as {
    name: string;
    scheduled_start: string | null;
  } | null;
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

  const mySquadId = me?.squad_id ?? "";
  const isSquadA = mySquadId === squadA.id;
  const isSquadB = mySquadId === squadB.id;
  const myCompositionSubmitted = isSquadA
    ? encounter.squad_a_composition_submitted
    : encounter.squad_b_composition_submitted;
  const theirCompositionSubmitted = isSquadA
    ? encounter.squad_b_composition_submitted
    : encounter.squad_a_composition_submitted;

  const round1Games = games.filter((g) => g.encounter_round === 1);
  const round2Games = games.filter((g) => g.encounter_round === 2);

  // Load players + points for composition form
  let myPlayers: Array<{
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
  }> = [];

  if (encounter.status === "composition" && mySquadId) {
    const { data: players } = await supabase
      .from("players")
      .select("*")
      .eq("squad_id", mySquadId);

    if (players) {
      // Load points for each player
      const playerIds = players.map((p) => p.id);
      const { data: pts } = await supabase
        .from("player_tournament_points")
        .select("*")
        .in("player_id", playerIds);

      myPlayers = players.map((p) => ({
        ...p,
        gender: p.gender as Gender,
        role: p.role as UserRole,
        points: pts?.find((pt) => pt.player_id === p.id) ?? null,
      }));
    }
  }

  // Load revealed compositions if revealed
  let revealedCompositions: {
    squadA: { squad_id: string; data: Record<string, string> } | null;
    squadB: { squad_id: string; data: Record<string, string> } | null;
  } = { squadA: null, squadB: null };

  if (encounter.composition_revealed) {
    const { data: compositions } = await supabase
      .from("compositions")
      .select(`
        squad_id,
        mixed1_man:players!compositions_mixed1_man_id_fkey(first_name, last_name),
        mixed1_woman:players!compositions_mixed1_woman_id_fkey(first_name, last_name),
        mixed2_man:players!compositions_mixed2_man_id_fkey(first_name, last_name),
        mixed2_woman:players!compositions_mixed2_woman_id_fkey(first_name, last_name),
        open1_player1:players!compositions_open1_player1_id_fkey(first_name, last_name),
        open1_player2:players!compositions_open1_player2_id_fkey(first_name, last_name),
        open2_player1:players!compositions_open2_player1_id_fkey(first_name, last_name),
        open2_player2:players!compositions_open2_player2_id_fkey(first_name, last_name)
      `)
      .eq("encounter_id", id);

    const compA = compositions?.find((c) => c.squad_id === squadA.id);
    const compB = compositions?.find((c) => c.squad_id === squadB.id);

    if (compA) revealedCompositions.squadA = { squad_id: squadA.id, data: compA as unknown as Record<string, string> };
    if (compB) revealedCompositions.squadB = { squad_id: squadB.id, data: compB as unknown as Record<string, string> };
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">{round?.name ?? "Encounter"}</p>
        <h1
          className="text-2xl font-bold mt-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
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

      {/* Composition phase */}
      {encounter.status === "composition" && (
        <EncounterComposition
          encounterId={encounter.id}
          squadId={mySquadId}
          myCompositionSubmitted={myCompositionSubmitted}
          theirCompositionSubmitted={theirCompositionSubmitted}
          compositionRevealed={encounter.composition_revealed}
          players={myPlayers}
          squadAName={squadA.name}
          squadBName={squadB.name}
          revealedCompositions={revealedCompositions}
        />
      )}

      {/* Revealed compositions display */}
      {encounter.composition_revealed && encounter.status !== "composition" && (
        <RevealedCompositionsDisplay
          revealedCompositions={revealedCompositions}
          squadAName={squadA.name}
          squadBName={squadB.name}
        />
      )}

      {/* Score entry */}
      {round1Games.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 text-[#6b6b7a] uppercase tracking-wide text-xs">
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
                mySquadId={mySquadId}
              />
            ))}
          </div>
        </section>
      )}

      {round2Games.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 text-[#6b6b7a] uppercase tracking-wide text-xs">
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
                mySquadId={mySquadId}
              />
            ))}
          </div>
        </section>
      )}

      {games.length === 0 && encounter.status !== "composition" && (
        <Card>
          <p className="text-sm text-[#6b6b7a]">
            Games will appear here once the encounter starts and compositions are submitted.
          </p>
        </Card>
      )}
    </div>
  );
}

function RevealedCompositionsDisplay({
  revealedCompositions,
  squadAName,
  squadBName,
}: {
  revealedCompositions: {
    squadA: { squad_id: string; data: Record<string, string> } | null;
    squadB: { squad_id: string; data: Record<string, string> } | null;
  };
  squadAName: string;
  squadBName: string;
}) {
  const sides = [
    { name: squadAName, comp: revealedCompositions.squadA },
    { name: squadBName, comp: revealedCompositions.squadB },
  ];

  return (
    <div>
      <p className="label-overline mb-3">Compositions</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sides.map(({ name, comp }) => (
          <Card key={name}>
            <p className="font-semibold text-sm mb-3">{name}</p>
            {comp ? (
              <CompositionDisplay data={comp.data} />
            ) : (
              <p className="text-xs text-[#6b6b7a]">Not submitted</p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function playerName(p: unknown): string {
  if (typeof p === "object" && p !== null && "first_name" in p) {
    const obj = p as { first_name: string; last_name: string };
    return `${obj.first_name} ${obj.last_name}`;
  }
  return "?";
}

function CompositionDisplay({ data }: { data: Record<string, unknown> }) {
  const rows = [
    { label: "Mixed 1", players: [playerName(data.mixed1_man), playerName(data.mixed1_woman)] },
    { label: "Mixed 2", players: [playerName(data.mixed2_man), playerName(data.mixed2_woman)] },
    { label: "Open 1", players: [playerName(data.open1_player1), playerName(data.open1_player2)] },
    { label: "Open 2", players: [playerName(data.open2_player1), playerName(data.open2_player2)] },
  ];

  return (
    <div className="space-y-2 text-sm">
      {rows.map(({ label, players }) => (
        <div key={label} className="flex gap-2">
          <span className="text-xs text-[#6b6b7a] w-14 shrink-0 mt-0.5">{label}</span>
          <span>{players.join(" + ")}</span>
        </div>
      ))}
    </div>
  );
}
