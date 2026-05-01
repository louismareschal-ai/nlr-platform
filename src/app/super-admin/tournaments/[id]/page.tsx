import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TournamentActions } from "./TournamentActions";
import { SquadManager } from "./SquadManager";
import { CourtManager } from "./CourtManager";
import { ScheduleManager } from "./ScheduleManager";
import Link from "next/link";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: tournament }, { data: squads }, { data: courts }, { data: rounds }] =
    await Promise.all([
      supabase.from("tournaments").select("*").eq("id", id).single(),
      supabase
        .from("squads")
        .select("*, players(id, first_name, last_name, gender, role)")
        .eq("tournament_id", id)
        .order("seed"),
      supabase.from("courts").select("*").eq("tournament_id", id).order("number"),
      supabase.from("rounds").select("*").eq("tournament_id", id).order("round_number"),
    ]);

  if (!tournament) notFound();

  const statusColorMap: Record<string, "neutral" | "warning" | "success"> = {
    setup: "neutral",
    registration: "warning",
    active: "success",
    completed: "neutral",
  };
  const statusColor = statusColorMap[tournament.status] ?? "neutral";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/super-admin/tournaments" className="text-xs text-[#6b6b7a] hover:text-[#f0ece3] transition-colors">
            ← Tournaments
          </Link>
          <h1 className="text-2xl font-bold mt-2" style={{ fontFamily: "var(--font-display)" }}>
            {tournament.name}
          </h1>
          <p className="text-sm text-[#6b6b7a] mt-0.5">
            {new Date(tournament.date).toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric",
            })}
            {tournament.location ? ` · ${tournament.location}` : ""}
          </p>
        </div>
        <Badge variant={statusColor}>{tournament.status}</Badge>
      </div>

      {/* Status actions */}
      <TournamentActions tournament={tournament} />

      {/* Squads */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Squads</h2>
        <SquadManager tournamentId={id} squads={squads ?? []} />
      </section>

      {/* Courts */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Courts</h2>
        <CourtManager
          tournamentId={id}
          courts={courts ?? []}
          defaultCount={tournament.courts_count}
        />
      </section>

      {/* Schedule */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Round Schedule</h2>
        <ScheduleManager
          tournamentId={id}
          rounds={rounds ?? []}
          squadCount={(squads ?? []).length}
        />
      </section>
    </div>
  );
}
