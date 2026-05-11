import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { BRACKET_LABELS, GAME_LABELS } from "@/lib/tournament/bracket";
import { EncounterActions } from "./EncounterActions";
import type { BracketSlot, GameType, GameSet, ScoreStatus } from "@/types";

type PlayerName = { last_name: string } | null;
type CompositionRow = {
  squad_id: string;
  mixed1_man: PlayerName;
  mixed1_woman: PlayerName;
  mixed2_man: PlayerName;
  mixed2_woman: PlayerName;
  open1_player1: PlayerName;
  open1_player2: PlayerName;
  open2_player1: PlayerName;
  open2_player2: PlayerName;
};

type GameLineup = { a: string; b: string } | null;
type LineupMap = Partial<Record<GameType, GameLineup>>;

function lastName(p: PlayerName) {
  return p?.last_name ?? "?";
}

function buildLineupMap(compA: CompositionRow | null, compB: CompositionRow | null): LineupMap {
  if (!compA && !compB) return {};
  return {
    mixed1: { a: `${lastName(compA?.mixed1_man ?? null)} / ${lastName(compA?.mixed1_woman ?? null)}`, b: `${lastName(compB?.mixed1_man ?? null)} / ${lastName(compB?.mixed1_woman ?? null)}` },
    mixed2: { a: `${lastName(compA?.mixed2_man ?? null)} / ${lastName(compA?.mixed2_woman ?? null)}`, b: `${lastName(compB?.mixed2_man ?? null)} / ${lastName(compB?.mixed2_woman ?? null)}` },
    open1:  { a: `${lastName(compA?.open1_player1 ?? null)} / ${lastName(compA?.open1_player2 ?? null)}`, b: `${lastName(compB?.open1_player1 ?? null)} / ${lastName(compB?.open1_player2 ?? null)}` },
    open2:  { a: `${lastName(compA?.open2_player1 ?? null)} / ${lastName(compA?.open2_player2 ?? null)}`, b: `${lastName(compB?.open2_player1 ?? null)} / ${lastName(compB?.open2_player2 ?? null)}` },
  };
}

export default async function SuperAdminEncounterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: encounter } = await supabase
    .from("encounters")
    .select(`
      id, status, bracket_slot, winner_id, loser_id,
      squad_a_id, squad_b_id,
      squad_a_composition_submitted, squad_b_composition_submitted,
      composition_revealed,
      squad_a:squads!encounters_squad_a_id_fkey(id, name),
      squad_b:squads!encounters_squad_b_id_fkey(id, name),
      winner:squads!encounters_winner_id_fkey(name),
      loser:squads!encounters_loser_id_fkey(name),
      rounds(name, scheduled_start),
      games(
        id, game_type, encounter_round, score_status,
        score_entered_by, score_confirmed_by, winner_squad_id,
        sets, status,
        courts(name, number)
      )
    `)
    .eq("id", id)
    .single();

  if (!encounter) notFound();

  const squadA = encounter.squad_a as unknown as { id: string; name: string };
  const squadB = encounter.squad_b as unknown as { id: string; name: string };
  const winner = encounter.winner as unknown as { name: string } | null;
  const round = encounter.rounds as unknown as { name: string; scheduled_start: string | null } | null;
  const games = (encounter.games ?? []) as unknown as Array<{
    id: string;
    game_type: GameType;
    encounter_round: number;
    score_status: ScoreStatus;
    score_entered_by: string | null;
    score_confirmed_by: string | null;
    winner_squad_id: string | null;
    sets: GameSet[];
    status: string;
    courts: { name: string; number: number } | null;
  }>;

  // Load compositions with player last names if revealed
  let lineupMap: LineupMap = {};
  let compA: CompositionRow | null = null;
  let compB: CompositionRow | null = null;

  if (encounter.composition_revealed) {
    const { data: compositions } = await supabase
      .from("compositions")
      .select(`
        squad_id,
        mixed1_man:players!compositions_mixed1_man_id_fkey(last_name),
        mixed1_woman:players!compositions_mixed1_woman_id_fkey(last_name),
        mixed2_man:players!compositions_mixed2_man_id_fkey(last_name),
        mixed2_woman:players!compositions_mixed2_woman_id_fkey(last_name),
        open1_player1:players!compositions_open1_player1_id_fkey(last_name),
        open1_player2:players!compositions_open1_player2_id_fkey(last_name),
        open2_player1:players!compositions_open2_player1_id_fkey(last_name),
        open2_player2:players!compositions_open2_player2_id_fkey(last_name)
      `)
      .eq("encounter_id", id);

    compA = (compositions?.find((c) => c.squad_id === squadA.id) as unknown as CompositionRow) ?? null;
    compB = (compositions?.find((c) => c.squad_id === squadB.id) as unknown as CompositionRow) ?? null;
    lineupMap = buildLineupMap(compA, compB);
  }

  const statusBadge: Record<string, "neutral" | "warning" | "success" | "gold"> = {
    pending: "neutral",
    composition: "warning",
    mixed_round: "warning",
    open_round: "warning",
    scoring: "warning",
    completed: "success",
  };

  const gamesWonA = games.filter((g) => g.winner_squad_id === squadA.id && g.score_status === "confirmed").length;
  const gamesWonB = games.filter((g) => g.winner_squad_id === squadB.id && g.score_status === "confirmed").length;

  const round1Games = games.filter((g) => g.encounter_round === 1);
  const round2Games = games.filter((g) => g.encounter_round === 2);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div>
        <a
          href="/super-admin/bracket"
          className="inline-flex items-center gap-1.5 text-xs text-[#6b6b7a] hover:text-[#f0ece3] transition-colors mb-4"
        >
          <span>←</span> Back to bracket
        </a>
        <p className="label-overline">
          {round?.name ?? "Encounter"} — {BRACKET_LABELS[encounter.bracket_slot as BracketSlot]}
        </p>
        <h1 className="text-3xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          {squadA.name} vs {squadB.name}
        </h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <Badge variant={statusBadge[encounter.status] ?? "neutral"}>
            {encounter.status.replace(/_/g, " ")}
          </Badge>
          {round?.scheduled_start && (
            <span className="text-sm text-[#6b6b7a]">
              {new Date(round.scheduled_start).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          {winner && (
            <span className="text-sm text-[#e8b84b] font-medium">
              Winner: {winner.name}
            </span>
          )}
        </div>
      </div>

      {/* Score summary */}
      {games.length > 0 && (
        <Card>
          <p className="label-overline mb-3">Score</p>
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-[#6b6b7a]">{squadA.name}</p>
              <p
                className={`text-5xl font-bold ${gamesWonA >= 3 ? "text-[#e8b84b]" : "text-[#f0ece3]"}`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {gamesWonA}
              </p>
            </div>
            <span className="text-2xl text-[#6b6b7a]">—</span>
            <div className="text-center">
              <p className="text-sm text-[#6b6b7a]">{squadB.name}</p>
              <p
                className={`text-5xl font-bold ${gamesWonB >= 3 ? "text-[#e8b84b]" : "text-[#f0ece3]"}`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {gamesWonB}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Composition status */}
      <Card>
        <p className="label-overline mb-3">Compositions</p>
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${encounter.squad_a_composition_submitted ? "bg-[#34d399]" : "bg-[#6b6b7a]"}`}
            />
            <span className="text-sm">{squadA.name}</span>
            <span className="text-xs text-[#6b6b7a]">
              {encounter.squad_a_composition_submitted ? "Submitted" : "Pending"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${encounter.squad_b_composition_submitted ? "bg-[#34d399]" : "bg-[#6b6b7a]"}`}
            />
            <span className="text-sm">{squadB.name}</span>
            <span className="text-xs text-[#6b6b7a]">
              {encounter.squad_b_composition_submitted ? "Submitted" : "Pending"}
            </span>
          </div>
        </div>

        {/* Revealed lineup breakdown */}
        {encounter.composition_revealed && (compA || compB) && (
          <div className="border-t border-[#1a1a24] pt-3 mt-1">
            <p className="text-xs text-[#34d399] mb-3">Compositions revealed</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#6b6b7a]">
                    <th className="text-left pb-2 w-16">Game</th>
                    <th className="text-left pb-2">{squadA.name}</th>
                    <th className="text-center pb-2 px-2 text-[#1a1a24]">vs</th>
                    <th className="text-left pb-2">{squadB.name}</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  {(["mixed1", "mixed2", "open1", "open2"] as GameType[]).map((gt) => {
                    const lineup = lineupMap[gt];
                    return (
                      <tr key={gt}>
                        <td className="text-[#6b6b7a] pr-3 py-0.5">{GAME_LABELS[gt]}</td>
                        <td className="font-medium py-0.5">{lineup?.a ?? "—"}</td>
                        <td className="text-center px-2 text-[#1a1a24] py-0.5">·</td>
                        <td className="font-medium py-0.5">{lineup?.b ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Games by round */}
      {round1Games.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">
            Round 1 — Mixed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {round1Games.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                squadAId={squadA.id}
                squadBId={squadB.id}
                squadAName={squadA.name}
                squadBName={squadB.name}
                lineup={lineupMap[g.game_type] ?? null}
              />
            ))}
          </div>
        </div>
      )}

      {round2Games.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[#6b6b7a] uppercase tracking-wide mb-3">
            Round 2 — Open + Women
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {round2Games.map((g) => (
              <GameCard
                key={g.id}
                game={g}
                squadAId={squadA.id}
                squadBId={squadB.id}
                squadAName={squadA.name}
                squadBName={squadB.name}
                lineup={lineupMap[g.game_type] ?? null}
              />
            ))}
          </div>
        </div>
      )}

      {games.length === 0 && (
        <Card>
          <p className="text-sm text-[#6b6b7a]">
            No games yet. Games are created when the encounter starts.
          </p>
        </Card>
      )}

      {/* Super admin controls */}
      <EncounterActions
        encounterId={encounter.id}
        currentStatus={encounter.status}
        squadAId={squadA.id}
        squadBId={squadB.id}
        squadAName={squadA.name}
        squadBName={squadB.name}
        compositionRevealed={encounter.composition_revealed}
        games={games}
      />
    </div>
  );
}

function GameCard({
  game,
  squadAId,
  squadBId,
  squadAName,
  squadBName,
  lineup,
}: {
  game: {
    id: string;
    game_type: GameType;
    score_status: ScoreStatus;
    winner_squad_id: string | null;
    sets: GameSet[];
    courts: { name: string; number: number } | null;
  };
  squadAId: string;
  squadBId: string;
  squadAName: string;
  squadBName: string;
  lineup: { a: string; b: string } | null;
}) {
  const statusVariant: Record<ScoreStatus, "neutral" | "warning" | "success"> = {
    pending: "neutral",
    submitted: "warning",
    confirmed: "success",
    disputed: "neutral",
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-semibold text-sm">{GAME_LABELS[game.game_type]}</h3>
          {game.courts && (
            <p className="text-xs text-[#6b6b7a]">Court {game.courts.number} — {game.courts.name}</p>
          )}
        </div>
        <Badge variant={statusVariant[game.score_status]}>
          {game.score_status}
        </Badge>
      </div>

      {/* Player lineup */}
      {lineup && (
        <div className="text-xs mb-2 space-y-0.5">
          <div className="flex gap-2">
            <span className="text-[#6b6b7a] w-12 shrink-0">{squadAName.split(" ")[0]}</span>
            <span className="font-medium text-[#f0ece3]">{lineup.a}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#6b6b7a] w-12 shrink-0">{squadBName.split(" ")[0]}</span>
            <span className="font-medium text-[#f0ece3]">{lineup.b}</span>
          </div>
        </div>
      )}

      {game.sets && game.sets.length > 0 ? (
        <div className="space-y-1 border-t border-[#1a1a24] pt-2 mt-1">
          <div className="grid grid-cols-3 text-xs text-[#6b6b7a] mb-1">
            <span>Set</span>
            <span className="text-center">{squadAName}</span>
            <span className="text-center">{squadBName}</span>
          </div>
          {game.sets.map((s) => (
            <div key={s.set_number} className="grid grid-cols-3 text-sm">
              <span className="text-[#6b6b7a]">Set {s.set_number}</span>
              <span className={`text-center font-medium ${s.score_a > s.score_b ? "text-[#34d399]" : ""}`}>
                {s.score_a}
              </span>
              <span className={`text-center font-medium ${s.score_b > s.score_a ? "text-[#34d399]" : ""}`}>
                {s.score_b}
              </span>
            </div>
          ))}
          {game.winner_squad_id && (
            <p className="text-xs text-[#e8b84b] mt-1 font-medium">
              Winner: {game.winner_squad_id === squadAId ? squadAName : squadBName}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-[#6b6b7a]">No score entered yet</p>
      )}
    </Card>
  );
}
