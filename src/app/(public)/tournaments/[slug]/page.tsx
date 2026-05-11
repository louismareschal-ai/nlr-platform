import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BracketView } from "@/components/bracket/BracketView";
import type { BracketSlot } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  setup: "Setup",
  registration: "Registration open",
  active: "Live now",
  completed: "Completed",
};

export default async function PublicTournamentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, slug, date, location, status, courts_count")
    .eq("slug", slug)
    .single();

  if (!tournament) notFound();

  // Load squads with players
  const { data: squads } = await supabase
    .from("squads")
    .select(`
      id, name, seed,
      players(id, first_name, last_name, gender, photo_url)
    `)
    .eq("tournament_id", tournament.id)
    .order("seed");

  // Load encounters for bracket
  const { data: encounters } = await supabase
    .from("encounters")
    .select(`
      id, bracket_slot, winner_id, squad_a_id, squad_b_id, status,
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      rounds(name)
    `)
    .eq("tournament_id", tournament.id);

  const isActive = tournament.status === "active";
  const isCompleted = tournament.status === "completed";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <p className="label-overline">{tournament.location ?? "NLR Open"}</p>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isActive
                ? "bg-[#e8b84b]/10 text-[#e8b84b] border border-[#e8b84b]/30"
                : "bg-[#1a1a24] text-[#6b6b7a]"
            }`}
          >
            {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e8b84b] mr-1.5 animate-pulse" />}
            {STATUS_LABELS[tournament.status] ?? tournament.status}
          </span>
        </div>
        <h1 className="text-4xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          {tournament.name}
        </h1>
        <div className="flex gap-4 mt-2 text-sm text-[#6b6b7a]">
          <span>
            {new Date(tournament.date).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          {tournament.location && <span>{tournament.location}</span>}
          {(squads ?? []).length > 0 && (
            <span>{squads?.length} squad{squads?.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* Format description */}
      <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-5">
        <p className="label-overline mb-2">Format</p>
        <div className="text-sm text-[#6b6b7a] space-y-1">
          <p>8 squads (4 men + 2 women each) compete in a single-elimination bracket with placement matches.</p>
          <p>Each encounter: 5 games — Mixed 1, Mixed 2, Open 1, Open 2, Women. First to win 3 games advances.</p>
          <p>Games are best-of-3 sets to 15 (win by 2, cap 21-20).</p>
          {tournament.courts_count > 0 && (
            <p>{tournament.courts_count} courts available.</p>
          )}
        </div>
      </div>

      {/* Bracket */}
      {(encounters ?? []).length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Bracket
          </h2>
          <BracketView
            encounters={(encounters ?? []).map((e) => ({
              ...e,
              bracket_slot: e.bracket_slot as BracketSlot,
              squad_a: e.squad_a as unknown as { name: string } | null,
              squad_b: e.squad_b as unknown as { name: string } | null,
              round: e.rounds as unknown as { name: string },
            }))}
          />
        </div>
      )}

      {/* Squad rosters */}
      {(squads ?? []).length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
            Squads
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(squads ?? []).map((squad) => {
              const players = squad.players as unknown as Array<{
                id: string;
                first_name: string;
                last_name: string;
                gender: string;
                photo_url: string | null;
              }>;
              const men = players.filter((p) => p.gender === "man");
              const women = players.filter((p) => p.gender === "woman");

              return (
                <div
                  key={squad.id}
                  className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {squad.seed && (
                      <span className="text-xs font-bold text-[#e8b84b] w-6 text-center">
                        #{squad.seed}
                      </span>
                    )}
                    <h3
                      className="font-bold text-lg"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {squad.name}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {men.length > 0 && (
                      <div>
                        <p className="text-xs text-[#6b6b7a] mb-1">Men</p>
                        <div className="space-y-1">
                          {men.map((p) => (
                            <PlayerRow key={p.id} player={p} />
                          ))}
                        </div>
                      </div>
                    )}
                    {women.length > 0 && (
                      <div>
                        <p className="text-xs text-[#6b6b7a] mb-1">Women</p>
                        <div className="space-y-1">
                          {women.map((p) => (
                            <PlayerRow key={p.id} player={p} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(squads ?? []).length === 0 && (encounters ?? []).length === 0 && (
        <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-8 text-center">
          <p className="text-sm text-[#6b6b7a]">
            Registration is not yet open. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}

function PlayerRow({
  player,
}: {
  player: { id: string; first_name: string; last_name: string; photo_url: string | null };
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full bg-[#1a1a24] overflow-hidden shrink-0 flex items-center justify-center">
        {player.photo_url ? (
          <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] text-[#6b6b7a]">
            {player.first_name[0]}{player.last_name[0]}
          </span>
        )}
      </div>
      <span className="text-sm">
        {player.first_name} {player.last_name}
      </span>
    </div>
  );
}
