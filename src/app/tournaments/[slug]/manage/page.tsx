import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  composition: "Composition",
  mixed_round: "Mixed round",
  open_round: "Open round",
  completed: "Completed",
};

export default async function ManagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase.from("players").select("role").eq("id", user.id).single();
  if (me?.role !== "super_admin") redirect(`/tournaments/${slug}/bracket`);

  const serviceClient = createServiceClient();
  const { data: tournament } = await serviceClient
    .from("tournaments")
    .select("id, name, status")
    .eq("slug", slug)
    .single();

  if (!tournament) notFound();

  const { data: encounters } = await serviceClient
    .from("encounters")
    .select(`
      id, status, bracket_slot,
      squad_a:squads!encounters_squad_a_id_fkey(name),
      squad_b:squads!encounters_squad_b_id_fkey(name),
      games(winner_squad_id, score_status)
    `)
    .eq("tournament_id", tournament.id)
    .order("created_at");

  const active = (encounters ?? []).filter((e) => e.status !== "pending" && e.status !== "completed");
  const completed = (encounters ?? []).filter((e) => e.status === "completed");
  const pending = (encounters ?? []).filter((e) => e.status === "pending");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
          Manage — {tournament.name}
        </h1>
        <div className="flex gap-3">
          <Link
            href={`/tournaments/${slug}/manage/players`}
            className="px-4 py-2 text-sm rounded-lg border border-[#1a1a24] text-[#6b6b7a] hover:text-[#f0ece3] hover:border-[#e8b84b]/30 transition-colors"
          >
            Players
          </Link>
          <Link
            href={`/super-admin/tournaments`}
            className="px-4 py-2 text-sm rounded-lg border border-[#1a1a24] text-[#6b6b7a] hover:text-[#f0ece3] hover:border-[#e8b84b]/30 transition-colors"
          >
            Tournament setup
          </Link>
        </div>
      </div>

      {active.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#e8b84b] uppercase tracking-widest mb-3">Active</p>
          <div className="space-y-2">
            {active.map((enc) => (
              <EncounterRow key={enc.id} enc={enc} slug={slug} />
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#6b6b7a] uppercase tracking-widest mb-3">Pending</p>
          <div className="space-y-2">
            {pending.map((enc) => (
              <EncounterRow key={enc.id} enc={enc} slug={slug} />
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <p className="text-xs font-bold text-[#6b6b7a] uppercase tracking-widest mb-3">Completed</p>
          <div className="space-y-2">
            {completed.map((enc) => (
              <EncounterRow key={enc.id} enc={enc} slug={slug} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EncounterRow({
  enc,
  slug,
}: {
  enc: {
    id: string;
    status: string;
    bracket_slot: string;
    squad_a: unknown;
    squad_b: unknown;
    games: Array<{ winner_squad_id: string | null; score_status: string }>;
  };
  slug: string;
}) {
  const squadA = enc.squad_a as { name: string } | null;
  const squadB = enc.squad_b as { name: string } | null;
  const confirmed = enc.games.filter((g) => g.score_status === "confirmed");

  return (
    <Link href={`/tournaments/${slug}/manage/encounters/${enc.id}`}>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">
                {squadA?.name ?? "TBD"} vs {squadB?.name ?? "TBD"}
              </p>
              <p className="text-xs text-[#6b6b7a] mt-0.5 capitalize">
                {enc.bracket_slot.replace("_", " ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {confirmed.length > 0 && (
              <span className="text-sm font-bold text-[#f0ece3] tabular-nums">
                {confirmed.filter((g) => g.winner_squad_id === (enc as { squad_a_id?: string }).squad_a_id).length}
                {" — "}
                {confirmed.filter((g) => g.winner_squad_id === (enc as { squad_b_id?: string }).squad_b_id).length}
              </span>
            )}
            <Badge variant={enc.status === "completed" ? "neutral" : enc.status === "composition" ? "warning" : "success"}>
              {STATUS_LABELS[enc.status] ?? enc.status}
            </Badge>
          </div>
        </div>
      </Card>
    </Link>
  );
}
