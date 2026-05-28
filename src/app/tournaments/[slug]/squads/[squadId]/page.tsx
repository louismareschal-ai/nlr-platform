import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

interface GameRow {
  game_type: string;
  winner_squad_id: string | null;
  score_status: string;
}

interface EncounterRow {
  id: string;
  bracket_slot: string;
  squad_a_id: string;
  squad_b_id: string;
  winner_id: string | null;
  status: string;
  squad_a: { name: string } | null;
  squad_b: { name: string } | null;
  games: GameRow[];
}

export default async function SquadDetailPage({
  params,
}: {
  params: Promise<{ slug: string; squadId: string }>;
}) {
  const { slug, squadId } = await params;
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!tournament) notFound();

  const { data: squad } = await supabase
    .from("squads")
    .select("id, name, seed, players(id, first_name, last_name, gender, photo_url)")
    .eq("id", squadId)
    .eq("tournament_id", tournament.id)
    .single();

  if (!squad) notFound();

  const { data: encounters } = await supabase
    .from("encounters")
    .select(`
      id, bracket_slot, squad_a_id, squad_b_id, winner_id, status,
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      games(game_type, winner_squad_id, score_status)
    `)
    .eq("tournament_id", tournament.id)
    .or(`squad_a_id.eq.${squadId},squad_b_id.eq.${squadId}`)
    .order("bracket_slot");

  const players = squad.players as unknown as Array<{
    id: string;
    first_name: string;
    last_name: string;
    gender: string;
    photo_url: string | null;
  }>;
  const men = players.filter((p) => p.gender === "man");
  const women = players.filter((p) => p.gender === "woman");

  const allEncounters = (encounters as unknown as EncounterRow[] ?? []);
  const completedEncounters = allEncounters.filter((e) => e.winner_id !== null);
  const wins = completedEncounters.filter((e) => e.winner_id === squadId).length;
  const losses = completedEncounters.filter(
    (e) => e.winner_id !== null && e.winner_id !== squadId
  ).length;

  // Final placement based on bracket_slot the squad won/lost
  const finalEnc = allEncounters.find((e) => e.bracket_slot === "final");
  const placement: { rank: number; label: string } | null = (() => {
    if (finalEnc?.winner_id === squadId) return { rank: 1, label: "Champions" };
    if (finalEnc && finalEnc.winner_id && finalEnc.winner_id !== squadId &&
        (finalEnc.squad_a_id === squadId || finalEnc.squad_b_id === squadId)) {
      return { rank: 2, label: "Finalist" };
    }
    const thirdEnc = allEncounters.find((e) => e.bracket_slot === "third_place");
    if (thirdEnc?.winner_id === squadId) return { rank: 3, label: "3rd place" };
    return null;
  })();

  // Aggregate per-game-type record (M1/M2/O1/O2/W) for the squad
  const gameTypes = ["mixed1", "mixed2", "open1", "open2", "women"] as const;
  const perGame = Object.fromEntries(
    gameTypes.map((gt) => {
      const games = (encounters as unknown as EncounterRow[] ?? []).flatMap((e) =>
        e.games.filter((g) => g.game_type === gt && g.score_status === "confirmed")
      );
      const w = games.filter((g) => g.winner_squad_id === squadId).length;
      const l = games.length - w;
      return [gt, { w, l }];
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/tournaments/${slug}/squads`}
          className="text-xs text-[#6b6b7a] hover:text-[#e8b84b] transition-colors"
        >
          ← All squads
        </Link>
        <div className="flex items-baseline gap-3 mt-2 flex-wrap">
          {squad.seed && (
            <span className="text-sm font-bold text-[#e8b84b]">#{squad.seed}</span>
          )}
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {squad.name}
          </h1>
          {placement && (
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide ${
                placement.rank === 1
                  ? "bg-[#e8b84b] text-[#050508]"
                  : placement.rank === 2
                    ? "bg-[#e8b84b]/20 text-[#e8b84b] border border-[#e8b84b]/30"
                    : "bg-[#1a1a24] text-[#e8b84b] border border-[#e8b84b]/20"
              }`}
            >
              {placement.label}
            </span>
          )}
        </div>
      </div>

      {/* Record */}
      <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-4">
        <p className="label-overline mb-3">Encounter record</p>
        <div className="flex gap-6">
          <div>
            <p className="text-3xl font-bold text-[#e8b84b] tabular-nums leading-none">
              {wins}
            </p>
            <p className="text-xs text-[#6b6b7a] mt-1">Won</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-[#f0ece3] tabular-nums leading-none">
              {losses}
            </p>
            <p className="text-xs text-[#6b6b7a] mt-1">Lost</p>
          </div>
        </div>

        {/* Per-game-type breakdown */}
        <div className="grid grid-cols-5 gap-2 mt-4 pt-4 border-t border-[#1a1a24]">
          {gameTypes.map((gt) => {
            const label = ({
              mixed1: "M1",
              mixed2: "M2",
              open1: "O1",
              open2: "O2",
              women: "W",
            } as Record<string, string>)[gt];
            const { w, l } = perGame[gt];
            return (
              <div key={gt} className="text-center">
                <p className="text-[10px] font-bold text-[#6b6b7a] uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm font-bold text-[#f0ece3] tabular-nums mt-1">
                  {w}–{l}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Roster */}
      <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-4">
        <p className="label-overline mb-3">Roster</p>
        <div className="space-y-4">
          {men.length > 0 && (
            <div>
              <p className="text-xs text-[#6b6b7a] mb-2">Open</p>
              <div className="space-y-1.5">
                {men.map((p) => (
                  <PlayerRow key={p.id} player={p} />
                ))}
              </div>
            </div>
          )}
          {women.length > 0 && (
            <div>
              <p className="text-xs text-[#6b6b7a] mb-2">Women</p>
              <div className="space-y-1.5">
                {women.map((p) => (
                  <PlayerRow key={p.id} player={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Encounters */}
      {(encounters?.length ?? 0) > 0 && (
        <div>
          <p className="label-overline mb-3">Matches</p>
          <div className="space-y-2">
            {(encounters as unknown as EncounterRow[]).map((e) => {
              const isA = e.squad_a_id === squadId;
              const opponent = isA ? e.squad_b : e.squad_a;
              const opponentId = isA ? e.squad_b_id : e.squad_a_id;
              const confirmed = e.games.filter((g) => g.score_status === "confirmed");
              const mine = confirmed.filter((g) => g.winner_squad_id === squadId).length;
              const theirs = confirmed.length - mine;
              const won = e.winner_id === squadId;
              const lost = e.winner_id !== null && e.winner_id !== squadId;
              return (
                <Link
                  key={e.id}
                  href={`/tournaments/${slug}/bracket`}
                  className="block rounded-lg border border-[#1a1a24] bg-[#0d0d12] hover:border-[#e8b84b]/40 p-3 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#6b6b7a] uppercase tracking-wide truncate">
                        {labelForSlot(e.bracket_slot)}
                      </p>
                      <p className="text-sm font-medium truncate mt-0.5">
                        vs {opponent?.name ?? "TBD"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {confirmed.length > 0 && (
                        <span
                          className={`text-base font-bold tabular-nums ${
                            won
                              ? "text-[#e8b84b]"
                              : lost
                                ? "text-[#6b6b7a]"
                                : "text-[#f0ece3]"
                          }`}
                        >
                          {mine}–{theirs}
                        </span>
                      )}
                      {won && (
                        <span className="text-[10px] font-bold text-[#e8b84b] px-1.5 py-0.5 rounded bg-[#e8b84b]/15 uppercase">
                          W
                        </span>
                      )}
                      {lost && (
                        <span className="text-[10px] font-bold text-[#6b6b7a] px-1.5 py-0.5 rounded bg-[#6b6b7a]/15 uppercase">
                          L
                        </span>
                      )}
                    </div>
                  </div>
                  {opponentId && (
                    <p className="sr-only">Opponent squad id: {opponentId}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  player,
}: {
  player: {
    id: string;
    first_name: string;
    last_name: string;
    photo_url: string | null;
  };
}) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
    >
      <div className="w-8 h-8 rounded-full bg-[#1a1a24] overflow-hidden shrink-0 flex items-center justify-center">
        {player.photo_url ? (
          <img
            src={player.photo_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-[#6b6b7a]">
            {player.first_name[0]}
            {player.last_name[0]}
          </span>
        )}
      </div>
      <span className="text-sm">
        {player.first_name} {player.last_name}
      </span>
    </Link>
  );
}

function labelForSlot(slot: string): string {
  const map: Record<string, string> = {
    qf_a: "Quarterfinal A",
    qf_b: "Quarterfinal B",
    qf_c: "Quarterfinal C",
    qf_d: "Quarterfinal D",
    sf_winners_1: "Semifinal 1",
    sf_winners_2: "Semifinal 2",
    final: "Grand Final",
    sf_placement_1: "5th–8th Semifinal 1",
    sf_placement_2: "5th–8th Semifinal 2",
    third_place: "3rd place",
    fifth_place: "5th place",
    seventh_place: "7th place",
  };
  return map[slot] ?? slot;
}
