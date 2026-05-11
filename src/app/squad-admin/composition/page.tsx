import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { CompositionForm } from "@/components/composition/CompositionForm";

export default async function CompositionPage() {
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

  // Find the next encounter needing composition
  const { data: encounters } = await supabase
    .from("encounters")
    .select("id, status, squad_a_id, squad_b_id, squad_a_composition_submitted, squad_b_composition_submitted, tournament_id")
    .or(`squad_a_id.eq.${me.squad_id},squad_b_id.eq.${me.squad_id}`)
    .eq("status", "composition")
    .limit(1);

  const encounter = encounters?.[0];

  if (!encounter) {
    return (
      <div className="space-y-4">
        <p className="label-overline">Squad Admin</p>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>Composition</h1>
        <Card>
          <p className="text-sm text-[#6b6b7a]">No encounter currently needs a composition. Check back when the next round starts.</p>
        </Card>
      </div>
    );
  }

  const isA = encounter.squad_a_id === me.squad_id;
  const alreadySubmitted = isA
    ? encounter.squad_a_composition_submitted
    : encounter.squad_b_composition_submitted;

  const { data: players } = await supabase
    .from("players")
    .select("*, player_tournament_points(*)")
    .eq("squad_id", me.squad_id);

  const playersWithPoints = (players ?? []).map((p) => ({
    ...p,
    points: (p.player_tournament_points as unknown as Array<{ tournament_id: string; mixed_points: number; open_points: number; women_points: number }>)
      ?.find((pt) => pt.tournament_id === encounter.tournament_id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Squad Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>Composition</h1>
      </div>

      {alreadySubmitted ? (
        <Card>
          <p className="text-sm text-[#34d399] font-medium">Composition submitted.</p>
          <p className="text-sm text-[#6b6b7a] mt-1">
            Waiting for the other squad to submit. Both compositions will be revealed simultaneously.
          </p>
        </Card>
      ) : (
        <CompositionForm
          encounterId={encounter.id}
          squadId={me.squad_id}
          players={playersWithPoints as Parameters<typeof CompositionForm>[0]["players"]}
          onSubmit={() => { window.location.reload(); }}
        />
      )}
    </div>
  );
}
