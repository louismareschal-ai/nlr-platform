import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
        .select("id, name, seed, players(id, gender)")
        .eq("tournament_id", id)
        .order("seed"),
      supabase.from("courts").select("*").eq("tournament_id", id).order("number"),
      supabase.from("rounds").select("*").eq("tournament_id", id).order("round_number"),
    ]);

  if (!tournament) notFound();

  const squadList = squads ?? [];
  const courtList = courts ?? [];
  const roundList = rounds ?? [];

  const totalPlayers = squadList.reduce(
    (sum, s) => sum + ((s.players as { id: string; gender: string }[])?.length ?? 0),
    0
  );

  // Show courts/schedule only once there are squads with players
  const hasPlayers = totalPlayers > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/super-admin/tournaments"
            className="text-xs text-[#6b6b7a] hover:text-[#f0ece3] transition-colors"
          >
            ← Tournaments
          </Link>
          <h1
            className="text-2xl font-bold mt-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {tournament.name}
          </h1>
          <p className="text-sm text-[#6b6b7a] mt-0.5">
            {new Date(tournament.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {tournament.location ? ` · ${tournament.location}` : ""}
          </p>
        </div>
      </div>

      {/* Status flow */}
      <TournamentActions
        tournament={tournament}
        squadCount={squadList.length}
        playerCount={totalPlayers}
        courtCount={courtList.length}
        roundCount={roundList.length}
      />

      {/* Step 1: Squads */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Step 1 — Squads</h2>
          <p className="text-sm text-[#6b6b7a] mt-0.5">
            Add all 8 squads and assign seeds 1–8. Players are added per squad by each squad's admin.
          </p>
        </div>
        <SquadManager
          tournamentId={id}
          squads={squadList.map((s) => ({
            ...s,
            players: (s.players as { id: string; gender: string }[]) ?? [],
          }))}
        />
      </section>

      {/* Step 2: Courts — only visible once squads exist */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Step 2 — Courts</h2>
          {!hasPlayers && squadList.length === 0 && (
            <p className="text-sm text-[#6b6b7a] mt-0.5">
              Add squads first, then set up courts.
            </p>
          )}
          {squadList.length > 0 && !hasPlayers && (
            <p className="text-sm text-[#6b6b7a] mt-0.5">
              Players need to be added to squads before courts can be set up. Share squad admin
              accounts with each team captain.
            </p>
          )}
          {hasPlayers && (
            <p className="text-sm text-[#6b6b7a] mt-0.5">
              Generate courts for the tournament. Court names can be customised after.
            </p>
          )}
        </div>
        {hasPlayers ? (
          <CourtManager
            tournamentId={id}
            courts={courtList}
            defaultCount={tournament.courts_count}
          />
        ) : (
          <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-4">
            <p className="text-sm text-[#6b6b7a]">
              Waiting for players to be added to squads.
            </p>
          </div>
        )}
      </section>

      {/* Step 3: Schedule — only visible once courts exist */}
      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">Step 3 — Schedule</h2>
          {!hasPlayers && (
            <p className="text-sm text-[#6b6b7a] mt-0.5">
              Add squads and players first.
            </p>
          )}
          {hasPlayers && courtList.length === 0 && (
            <p className="text-sm text-[#6b6b7a] mt-0.5">
              Generate courts first, then set the round schedule.
            </p>
          )}
          {hasPlayers && courtList.length > 0 && (
            <p className="text-sm text-[#6b6b7a] mt-0.5">
              Generate rounds and set their start times. You can adjust times later.
            </p>
          )}
        </div>
        {hasPlayers && courtList.length > 0 ? (
          <ScheduleManager
            tournamentId={id}
            rounds={roundList}
            squadCount={squadList.length}
          />
        ) : (
          <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-4">
            <p className="text-sm text-[#6b6b7a]">
              {!hasPlayers
                ? "Waiting for players to be added."
                : "Generate courts first."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
