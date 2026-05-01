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

  const [
    { data: tournament },
    { data: squads },
    { data: courts },
    { data: rounds },
    { data: tournamentPlayers },
  ] = await Promise.all([
    supabase.from("tournaments").select("*").eq("id", id).single(),
    supabase
      .from("squads")
      .select("id, name, seed, players(id, first_name, last_name, gender, photo_url)")
      .eq("tournament_id", id)
      .order("seed"),
    supabase.from("courts").select("*").eq("tournament_id", id).order("number"),
    supabase.from("rounds").select("*").eq("tournament_id", id).order("round_number"),
    // All players not yet in any squad (global pool — squad_id IS NULL)
    supabase
      .from("players")
      .select("id, first_name, last_name, gender, photo_url, squad_id")
      .is("squad_id", null)
      .eq("role", "player"),
  ]);

  if (!tournament) notFound();

  const squadList = squads ?? [];
  const courtList = courts ?? [];
  const roundList = rounds ?? [];

  type PartialPlayer = {
    id: string;
    first_name: string;
    last_name: string;
    gender: string;
    photo_url: string | null;
  };

  const unassignedPlayers = ((tournamentPlayers ?? []) as PartialPlayer[]).sort((a, b) => {
    if (a.gender !== b.gender) return a.gender === "man" ? -1 : 1;
    return a.last_name.localeCompare(b.last_name);
  });

  const totalPlayers = squadList.reduce(
    (sum, s) => sum + ((s.players as PartialPlayer[])?.length ?? 0),
    0
  );

  const hasPlayers = totalPlayers > 0;
  const hasCourts = courtList.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Status */}
      <TournamentActions
        tournament={tournament}
        squadCount={squadList.length}
        playerCount={totalPlayers}
        courtCount={courtList.length}
        roundCount={roundList.length}
      />

      {/* Step 1: Squads */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Step 1 — Squads</h2>
        <p className="text-sm text-[#6b6b7a] mb-4">
          Create the 8 squads, assign seeds, then fill each squad with 4 men and 2 women.
        </p>
        <SquadManager
          tournamentId={id}
          squads={squadList.map((s) => ({
            ...s,
            players: (s.players as PartialPlayer[]) ?? [],
          }))}
          unassignedPlayers={unassignedPlayers}
        />
      </section>

      {/* Step 2: Courts */}
      {hasPlayers ? (
        <section>
          <h2 className="text-lg font-semibold mb-1">Step 2 — Courts</h2>
          <p className="text-sm text-[#6b6b7a] mb-4">
            Generate courts for the tournament. You can rename them after.
          </p>
          <CourtManager
            tournamentId={id}
            courts={courtList}
            defaultCount={tournament.courts_count}
          />
        </section>
      ) : (
        <div className="flex items-center gap-3 text-sm text-[#3a3a4a]">
          <span className="w-5 h-5 rounded-full border border-[#1a1a24] flex items-center justify-center text-xs shrink-0">2</span>
          <span>Courts — fill squads first</span>
        </div>
      )}

      {/* Step 3: Schedule */}
      {hasPlayers && hasCourts ? (
        <section>
          <h2 className="text-lg font-semibold mb-1">Step 3 — Schedule</h2>
          <p className="text-sm text-[#6b6b7a] mb-4">
            Generate rounds and set start times. You can adjust times later.
          </p>
          <ScheduleManager
            tournamentId={id}
            rounds={roundList}
            squadCount={squadList.length}
          />
        </section>
      ) : (
        <div className="flex items-center gap-3 text-sm text-[#3a3a4a]">
          <span className="w-5 h-5 rounded-full border border-[#1a1a24] flex items-center justify-center text-xs shrink-0">3</span>
          <span>Schedule — {!hasPlayers ? "fill squads first" : "generate courts first"}</span>
        </div>
      )}
    </div>
  );
}
