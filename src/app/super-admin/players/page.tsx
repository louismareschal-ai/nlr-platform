import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PlayerPointsEditor } from "./PlayerPointsEditor";
import { PlayerRoleEditor } from "./PlayerRoleEditor";
import type { UserRole } from "@/types";

export default async function SuperAdminPlayersPage() {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select(`
      *,
      squads(id, name, tournaments(name)),
      player_tournament_points(id, mixed_points, open_points, women_points, tournament_id)
    `)
    .order("last_name");

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Super Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          All Players ({players?.length ?? 0})
        </h1>
      </div>

      <div className="space-y-2">
        {(players ?? []).map((p) => {
          const squad = p.squads as {
            id: string;
            name: string;
            tournaments: { name: string } | null;
          } | null;
          const pts = (p.player_tournament_points as unknown as Array<{
            id: string;
            mixed_points: number;
            open_points: number;
            women_points: number;
            tournament_id: string;
          }>)?.[0] ?? null;

          return (
            <Card key={p.id}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Player info */}
                <div className="flex items-center gap-3">
                  {p.photo_url && (
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {p.first_name} {p.last_name}
                    </p>
                    <p className="text-xs text-[#6b6b7a]">
                      {squad?.name ?? "No squad"}
                      {squad?.tournaments ? ` · ${squad.tournaments.name}` : ""}
                      {" · "}
                      {p.gender}
                    </p>
                    {p.playerzone_id && (
                      <p className="text-xs text-[#6b6b7a]">Playerzone ID: {p.playerzone_id}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Badges */}
                  <div className="flex gap-2 flex-wrap items-center">
                    {!p.temp_password_changed && (
                      <Badge variant="warning">Temp pwd</Badge>
                    )}
                  </div>

                  {/* Role editor */}
                  <PlayerRoleEditor
                    playerId={p.id}
                    currentRole={p.role as UserRole}
                    playerName={`${p.first_name} ${p.last_name}`}
                  />

                  {/* Points editor */}
                  {pts && (
                    <PlayerPointsEditor
                      pointsId={pts.id}
                      mixedPoints={pts.mixed_points}
                      openPoints={pts.open_points}
                      womenPoints={pts.women_points}
                    />
                  )}
                  {!pts && (
                    <span className="text-xs text-[#6b6b7a]">No pts</span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {(players ?? []).length === 0 && (
          <Card>
            <p className="text-sm text-[#6b6b7a]">
              No players yet. Squad admins create player accounts.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
