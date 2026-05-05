import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AddPlayerForm } from "./AddPlayerForm";

export default async function SquadPlayersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("players")
    .select("squad_id")
    .eq("id", user.id)
    .single();

  if (!me?.squad_id) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>Players</h1>
        <p className="text-sm text-[#6b6b7a]">Not linked to a squad.</p>
      </div>
    );
  }

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .eq("squad_id", me.squad_id)
    .order("last_name");

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Squad Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          Players
        </h1>
      </div>

      <div className="space-y-2">
        {(players ?? []).map((p) => (
          <Card key={p.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{p.first_name} {p.last_name}</p>
                <p className="text-xs text-[#6b6b7a] capitalize">{p.gender}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.role === "squad_admin" && <Badge variant="gold">Admin</Badge>}
                {!p.temp_password_changed && <Badge variant="warning">Awaiting first login</Badge>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Add player</h2>
        <AddPlayerForm squadId={me.squad_id} />
      </div>
    </div>
  );
}
