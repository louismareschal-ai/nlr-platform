import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function TournamentSquadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("slug", slug)
    .single();

  if (!tournament) notFound();

  const { data: squads } = await supabase
    .from("squads")
    .select("id, name, seed, players(id, first_name, last_name, gender, photo_url)")
    .eq("tournament_id", tournament.id)
    .order("seed");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Squads
      </h1>

      {(squads ?? []).length === 0 ? (
        <p className="text-sm text-[#6b6b7a]">No squads registered yet.</p>
      ) : (
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
              <div key={squad.id} className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-4">
                <div className="flex items-center gap-2 mb-3">
                  {squad.seed && (
                    <span className="text-xs font-bold text-[#e8b84b] w-6 text-center">
                      #{squad.seed}
                    </span>
                  )}
                  <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                    {squad.name}
                  </h3>
                </div>

                <div className="space-y-3">
                  {men.length > 0 && (
                    <div>
                      <p className="text-xs text-[#6b6b7a] mb-1">Men</p>
                      <div className="space-y-1">
                        {men.map((p) => <PlayerRow key={p.id} player={p} />)}
                      </div>
                    </div>
                  )}
                  {women.length > 0 && (
                    <div>
                      <p className="text-xs text-[#6b6b7a] mb-1">Women</p>
                      <div className="space-y-1">
                        {women.map((p) => <PlayerRow key={p.id} player={p} />)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlayerRow({ player }: { player: { id: string; first_name: string; last_name: string; photo_url: string | null } }) {
  return (
    <Link href={`/players/${player.id}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <div className="w-6 h-6 rounded-full bg-[#1a1a24] overflow-hidden shrink-0 flex items-center justify-center">
        {player.photo_url ? (
          <img src={player.photo_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-[10px] text-[#6b6b7a]">{player.first_name[0]}{player.last_name[0]}</span>
        )}
      </div>
      <span className="text-sm">{player.first_name} {player.last_name}</span>
    </Link>
  );
}
