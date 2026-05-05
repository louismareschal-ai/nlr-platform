import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export default async function ScoresPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("squad_id")
    .eq("id", user.id)
    .single();

  if (!me?.squad_id) {
    return <p className="text-sm text-[#6b6b7a]">Not linked to a squad.</p>;
  }

  const { data: encounters } = await supabase
    .from("encounters")
    .select(`
      id, status, bracket_slot,
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      rounds(name),
      games(id, game_type, score_status, winner_squad_id)
    `)
    .or(`squad_a_id.eq.${me.squad_id},squad_b_id.eq.${me.squad_id}`)
    .in("status", ["mixed_round", "open_round", "scoring", "completed"]);

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Squad Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>Scores</h1>
      </div>

      {(encounters ?? []).length === 0 ? (
        <Card>
          <p className="text-sm text-[#6b6b7a]">No active encounters yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(encounters ?? []).map((e) => {
            const games = e.games as unknown as Array<{ id: string; game_type: string; score_status: string }>;
            const pending = games.filter((g) => g.score_status === "pending").length;
            const submitted = games.filter((g) => g.score_status === "submitted").length;
            const confirmed = games.filter((g) => g.score_status === "confirmed").length;
            return (
              <Card key={e.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">
                      vs {((e.squad_a ?? e.squad_b) as unknown as { name: string } | null)?.name ?? "TBD"}
                    </p>
                    <p className="text-xs text-[#6b6b7a] mt-0.5">
                      {confirmed}/{games.length} confirmed
                      {submitted > 0 && ` · ${submitted} awaiting confirmation`}
                    </p>
                  </div>
                  <Link
                    href={`/squad-admin/encounters/${e.id}`}
                    className="text-sm text-[#e8b84b] hover:underline"
                  >
                    Enter scores →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
