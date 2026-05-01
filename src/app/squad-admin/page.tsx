import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default async function SquadAdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: player } = await supabase
    .from("players")
    .select("*, squads(*)")
    .eq("id", user.id)
    .single();

  const squad = player?.squads as { id: string; name: string; seed: number | null } | null;
  if (!squad) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Squad Admin
        </h1>
        <p className="text-[#6b6b7a]">Your account is not linked to a squad yet. Contact the super admin.</p>
      </div>
    );
  }

  // Fetch squad's players and active encounters
  const [{ data: squadPlayers }, { data: encounters }] = await Promise.all([
    supabase
      .from("players")
      .select("id, first_name, last_name, gender, role")
      .eq("squad_id", squad.id),
    supabase
      .from("encounters")
      .select(`
        id, status, bracket_slot,
        squad_a_id, squad_b_id,
        squad_a_composition_submitted, squad_b_composition_submitted,
        composition_revealed,
        rounds(name, scheduled_start),
        squad_a:squads!encounters_squad_a_id_fkey(name),
        squad_b:squads!encounters_squad_b_id_fkey(name)
      `)
      .or(`squad_a_id.eq.${squad.id},squad_b_id.eq.${squad.id}`)
      .neq("status", "pending")
      .order("created_at"),
  ]);

  // Find encounters where this squad needs to submit composition or confirm scores
  const needsComposition = (encounters ?? []).filter((e) => {
    const isA = e.squad_a_id === squad.id;
    return (
      e.status === "composition" &&
      !(isA ? e.squad_a_composition_submitted : e.squad_b_composition_submitted)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Squad Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          {squad.name}
          {squad.seed && (
            <span className="text-[#6b6b7a] text-lg ml-2 font-normal">
              Seed {squad.seed}
            </span>
          )}
        </h1>
      </div>

      {/* Action required alerts */}
      {needsComposition.length > 0 && (
        <div className="bg-[#e8b84b]/10 border border-[#e8b84b]/20 rounded-xl p-4 flex items-start gap-3">
          <span className="text-[#e8b84b] text-xl mt-0.5">!</span>
          <div>
            <p className="text-sm font-semibold text-[#e8b84b]">
              Composition required
            </p>
            <p className="text-xs text-[#6b6b7a] mb-2">
              You need to submit your squad composition before the next encounter.
            </p>
            <Link href="/squad-admin/composition" className="text-sm text-[#e8b84b] hover:underline">
              Submit composition →
            </Link>
          </div>
        </div>
      )}

      {/* Players */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Players</h2>
          <Link href="/squad-admin/players" className="text-sm text-[#e8b84b] hover:underline">
            Manage →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(squadPlayers ?? []).map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">
                    {p.first_name} {p.last_name}
                  </p>
                  <p className="text-xs text-[#6b6b7a] capitalize">{p.gender}</p>
                </div>
                {p.role === "squad_admin" && (
                  <Badge variant="gold">Admin</Badge>
                )}
              </div>
            </Card>
          ))}
          {(squadPlayers ?? []).length === 0 && (
            <p className="text-sm text-[#6b6b7a]">No players yet.</p>
          )}
        </div>
      </div>

      {/* Upcoming encounters */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Encounters</h2>
        <div className="space-y-3">
          {(encounters ?? []).length === 0 && (
            <p className="text-sm text-[#6b6b7a]">No encounters scheduled yet.</p>
          )}
          {(encounters ?? []).map((e) => {
            const isA = e.squad_a_id === squad.id;
            const opponent = (isA ? e.squad_b : e.squad_a) as unknown as { name: string } | null;
            const round = e.rounds as unknown as { name: string; scheduled_start: string | null } | null;
            return (
              <Card key={e.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[#6b6b7a] mb-0.5">
                      {round?.name ?? "Round"}
                      {round?.scheduled_start && (
                        <span>
                          {" "}· {new Date(round.scheduled_start).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                    </p>
                    <p className="font-semibold">vs {opponent?.name ?? "TBD"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        e.status === "completed"
                          ? "neutral"
                          : e.status === "composition"
                          ? "warning"
                          : "success"
                      }
                    >
                      {e.status.replace("_", " ")}
                    </Badge>
                    <Link
                      href={`/squad-admin/encounters/${e.id}`}
                      className="text-sm text-[#e8b84b] hover:underline"
                    >
                      Open →
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
