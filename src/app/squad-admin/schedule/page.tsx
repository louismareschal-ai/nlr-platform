import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function SquadSchedulePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("squad_id, squads(name)")
    .eq("id", user.id)
    .single();

  if (!me?.squad_id) {
    return <p className="text-sm text-[#6b6b7a]">Not linked to a squad.</p>;
  }

  const { data: encounters } = await supabase
    .from("encounters")
    .select(`
      id, status, bracket_slot,
      squad_a_id, squad_b_id,
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      rounds(name, scheduled_start, round_number),
      games(id, game_type, courts(name, number))
    `)
    .or(`squad_a_id.eq.${me.squad_id},squad_b_id.eq.${me.squad_id}`)
    .order("created_at");

  const squad = me.squads as unknown as { name: string } | null;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Squad Admin · {squad?.name}</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>Schedule</h1>
      </div>

      {(encounters ?? []).length === 0 ? (
        <Card><p className="text-sm text-[#6b6b7a]">No encounters scheduled yet.</p></Card>
      ) : (
        <div className="space-y-4">
          {(encounters ?? []).map((e) => {
            const isA = e.squad_a_id === me.squad_id;
            const opponent = (isA ? e.squad_b : e.squad_a) as unknown as { name: string } | null;
            const round = e.rounds as unknown as { name: string; scheduled_start: string | null } | null;
            const games = e.games as unknown as Array<{ game_type: string; courts: { name: string; number: number } | null }>;

            return (
              <Card key={e.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-[#6b6b7a]">{round?.name}</p>
                    <p className="font-semibold">vs {opponent?.name ?? "TBD"}</p>
                    {round?.scheduled_start && (
                      <p className="text-sm text-[#f0ece3] mt-0.5">
                        {new Date(round.scheduled_start).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <Badge variant={e.status === "completed" ? "neutral" : e.status === "composition" ? "warning" : "success"}>
                    {e.status.replace("_", " ")}
                  </Badge>
                </div>
                {games.length > 0 && (
                  <div className="border-t border-[#1a1a24] pt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {games.map((g, i) => (
                      <div key={i} className="text-xs">
                        <p className="text-[#6b6b7a] capitalize">{g.game_type.replace(/(\d)/, " $1")}</p>
                        <p className="font-medium">{g.courts ? `Court ${g.courts.number}` : "TBD"}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
