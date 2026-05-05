import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function PlayerSchedule() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("*, squads(id, name, seed, tournament_id)")
    .eq("id", user.id)
    .single();

  const squad = player?.squads as {
    id: string;
    name: string;
    seed: number | null;
    tournament_id: string;
  } | null;

  if (!squad) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          My Schedule
        </h1>
        <p className="text-[#6b6b7a]">You are not linked to a squad yet.</p>
      </div>
    );
  }

  // Fetch encounters + game details
  const { data: encounters } = await supabase
    .from("encounters")
    .select(`
      id, status, bracket_slot,
      squad_a_id, squad_b_id,
      rounds(name, scheduled_start, round_number),
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      games(id, game_type, court_id, status, courts(name, number))
    `)
    .or(`squad_a_id.eq.${squad.id},squad_b_id.eq.${squad.id}`)
    .order("created_at");

  const now = new Date();

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Player</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          My Schedule
        </h1>
        <p className="text-sm text-[#6b6b7a] mt-1">
          {player.first_name} {player.last_name} · {squad.name}
          {squad.seed && ` · Seed ${squad.seed}`}
        </p>
      </div>

      <div className="space-y-4">
        {(encounters ?? []).length === 0 && (
          <p className="text-sm text-[#6b6b7a]">No encounters scheduled yet. Check back soon.</p>
        )}
        {(encounters ?? []).map((enc) => {
          const isA = enc.squad_a_id === squad.id;
          const opponent = (isA ? enc.squad_b : enc.squad_a) as unknown as { name: string } | null;
          const round = enc.rounds as unknown as {
            name: string;
            scheduled_start: string | null;
            round_number: number;
          } | null;
          const games = enc.games as unknown as Array<{
            id: string;
            game_type: string;
            status: string;
            courts: { name: string; number: number } | null;
          }>;

          const scheduledAt = round?.scheduled_start
            ? new Date(round.scheduled_start)
            : null;
          const isLate =
            scheduledAt && now > scheduledAt && enc.status !== "completed";

          return (
            <Card key={enc.id} gold={enc.status === "mixed_round" || enc.status === "open_round"}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-[#6b6b7a] mb-0.5">{round?.name ?? "Round"}</p>
                  <p className="text-lg font-semibold">
                    vs {opponent?.name ?? "TBD"}
                  </p>
                  {scheduledAt && (
                    <p className="text-sm text-[#6b6b7a] mt-0.5">
                      {scheduledAt.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge
                    variant={
                      enc.status === "completed"
                        ? "neutral"
                        : enc.status === "composition"
                        ? "warning"
                        : "success"
                    }
                  >
                    {enc.status.replace("_", " ")}
                  </Badge>
                  {isLate && (
                    <Badge variant="danger">Late</Badge>
                  )}
                </div>
              </div>

              {/* Court assignments */}
              {games.length > 0 && (
                <div className="border-t border-[#1a1a24] pt-3 mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {games.map((g) => (
                    <div key={g.id} className="text-xs">
                      <span className="text-[#6b6b7a] capitalize">
                        {g.game_type.replace(/(\d)/, " $1")}
                      </span>
                      <p className="font-medium">
                        {g.courts ? `Court ${g.courts.number}` : "TBD"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
