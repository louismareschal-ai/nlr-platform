import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function TournamentSchedulePage({
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

  const { data: rounds } = await supabase
    .from("rounds")
    .select(`
      id, name, round_number, scheduled_start, status,
      encounters(id, status, bracket_slot, squad_a_id, squad_b_id,
        squad_a:squads!encounters_squad_a_id_fkey(name),
        squad_b:squads!encounters_squad_b_id_fkey(name),
        games(game_type, court_id, courts(number))
      )
    `)
    .eq("tournament_id", tournament.id)
    .order("round_number");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
        Schedule
      </h1>

      {(rounds ?? []).length === 0 ? (
        <Card><p className="text-sm text-[#6b6b7a]">No schedule set yet.</p></Card>
      ) : (
        <div className="space-y-6">
          {(rounds ?? []).map((r) => {
            const encounters = r.encounters as unknown as Array<{
              id: string;
              status: string;
              bracket_slot: string;
              squad_a: { name: string } | null;
              squad_b: { name: string } | null;
              games: Array<{ game_type: string; courts: { number: number } | null }>;
            }>;

            return (
              <div key={r.id}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    {r.name}
                  </h2>
                  {r.scheduled_start && (
                    <span className="text-sm text-[#6b6b7a]">
                      {new Date(r.scheduled_start).toLocaleString("en-GB", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                  <Badge variant={r.status === "completed" ? "neutral" : r.status === "active" ? "success" : "neutral"}>
                    {r.status}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {encounters.map((enc) => (
                    <Card key={enc.id} gold={enc.status === "mixed_round" || enc.status === "open_round"}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-sm">
                          {enc.squad_a?.name ?? "TBD"} vs {enc.squad_b?.name ?? "TBD"}
                        </p>
                        <Badge variant={enc.status === "completed" ? "neutral" : enc.status === "composition" ? "warning" : "success"}>
                          {enc.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {enc.games.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2 pt-2 border-t border-[#1a1a24]">
                          {enc.games.map((g) => (
                            <div key={g.game_type} className="text-xs">
                              <p className="text-[#6b6b7a] capitalize">{g.game_type.replace(/(\d)/, " $1")}</p>
                              <p className="font-medium">{g.courts ? `Court ${g.courts.number}` : "TBD"}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
