import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function SuperAdminPlayersPage() {
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("*, squads(name, tournaments(name))")
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
          const squad = p.squads as { name: string; tournaments: { name: string } | null } | null;
          return (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {p.first_name} {p.last_name}
                  </p>
                  <p className="text-xs text-[#6b6b7a]">
                    {squad?.name ?? "No squad"}{squad?.tournaments ? ` · ${squad.tournaments.name}` : ""}
                    {" · "}{p.gender}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {p.role !== "player" && (
                    <Badge variant="gold">{p.role.replace("_", " ")}</Badge>
                  )}
                  {!p.temp_password_changed && (
                    <Badge variant="warning">Temp password</Badge>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {(players ?? []).length === 0 && (
          <Card>
            <p className="text-sm text-[#6b6b7a]">No players yet. Squad admins create player accounts.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
