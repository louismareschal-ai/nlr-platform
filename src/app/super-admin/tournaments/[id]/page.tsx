import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TournamentActions } from "./TournamentActions";
import { SquadManager } from "./SquadManager";
import { CourtManager } from "./CourtManager";
import { ScheduleManager } from "./ScheduleManager";
import { BracketManager } from "./BracketManager";
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
    { data: unassigned },
    { data: encounters },
  ] = await Promise.all([
    supabase.from("tournaments").select("*").eq("id", id).single(),
    supabase
      .from("squads")
      .select("id, name, seed, players(id, first_name, last_name, gender, photo_url)")
      .eq("tournament_id", id)
      .order("seed"),
    supabase.from("courts").select("*").eq("tournament_id", id).order("number"),
    supabase.from("rounds").select("*").eq("tournament_id", id).order("round_number"),
    supabase
      .from("players")
      .select("id, first_name, last_name, gender, photo_url")
      .is("squad_id", null)
      .eq("role", "player"),
    supabase
      .from("encounters")
      .select("id, bracket_slot, squad_a_id, squad_b_id, status, games(id, game_type, court_id, encounter_round)")
      .eq("tournament_id", id),
  ]);

  if (!tournament) notFound();

  type PartialPlayer = {
    id: string; first_name: string; last_name: string;
    gender: string; photo_url: string | null;
  };

  const squadList  = squads   ?? [];
  const courtList  = courts   ?? [];
  const roundList  = rounds   ?? [];
  const encounterList = (encounters ?? []) as Array<{
    id: string; bracket_slot: string; squad_a_id: string | null;
    squad_b_id: string | null; status: string;
    games: Array<{ id: string; game_type: string; court_id: string | null; encounter_round: number }>;
  }>;

  const totalPlayers = squadList.reduce(
    (sum, s) => sum + ((s.players as PartialPlayer[])?.length ?? 0),
    0
  );

  const hasPlayers  = totalPlayers > 0;
  const hasCourts   = courtList.length > 0;
  const hasSchedule = roundList.length > 0;
  const qfRound     = roundList.find((r) => r.round_number === 1);

  // Locked step placeholder
  function LockedStep({ n, label }: { n: number; label: string }) {
    return (
      <div className="flex items-center gap-3 text-sm text-[#3a3a4a]">
        <span className="w-5 h-5 rounded-full border border-[#1a1a24] flex items-center justify-center text-xs shrink-0">
          {n}
        </span>
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link href="/super-admin/tournaments" className="text-xs text-[#6b6b7a] hover:text-[#f0ece3] transition-colors">
          ← Tournaments
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ fontFamily: "var(--font-display)" }}>
          {tournament.name}
        </h1>
        <p className="text-sm text-[#6b6b7a] mt-0.5">
          {new Date(tournament.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
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

      {/* Step 1 — Squads */}
      <section>
        <h2 className="text-lg font-semibold mb-1">Step 1 — Squads</h2>
        <p className="text-sm text-[#6b6b7a] mb-4">
          Create 8 squads, assign seeds 1–8, fill each with 4 men and 2 women.
        </p>
        <SquadManager
          tournamentId={id}
          squads={squadList.map((s) => ({ ...s, players: (s.players as PartialPlayer[]) ?? [] }))}
          unassignedPlayers={(unassigned ?? []) as PartialPlayer[]}
        />
      </section>

      {/* Step 2 — Courts */}
      {hasPlayers ? (
        <section>
          <h2 className="text-lg font-semibold mb-1">Step 2 — Courts</h2>
          <p className="text-sm text-[#6b6b7a] mb-4">
            Generate the courts (physical nets). Rename them to match the venue layout.
          </p>
          <CourtManager
            tournamentId={id}
            courts={courtList}
            defaultCount={tournament.courts_count}
          />
        </section>
      ) : (
        <LockedStep n={2} label="Courts — fill squads first" />
      )}

      {/* Step 3 — Schedule */}
      {hasPlayers && hasCourts ? (
        <section>
          <h2 className="text-lg font-semibold mb-1">Step 3 — Schedule</h2>
          <p className="text-sm text-[#6b6b7a] mb-4">
            Set the start time for each round. Dates are pre-filled from the tournament date.
          </p>
          <ScheduleManager
            tournamentId={id}
            tournamentDate={tournament.date}
            rounds={roundList}
            squadCount={squadList.length}
          />
        </section>
      ) : (
        <LockedStep n={3} label={`Schedule — ${!hasPlayers ? "fill squads first" : "generate courts first"}`} />
      )}

      {/* Step 4 — Bracket */}
      {hasPlayers && hasCourts && hasSchedule ? (
        <section>
          <h2 className="text-lg font-semibold mb-1">Step 4 — Bracket</h2>
          <p className="text-sm text-[#6b6b7a] mb-4">
            Generate the quarterfinal bracket from squad seeds, then assign a court to each game.
          </p>
          <BracketManager
            tournamentId={id}
            roundId={qfRound?.id ?? ""}
            squads={squadList.map((s) => ({ id: s.id, name: s.name, seed: s.seed }))}
            courts={courtList}
            encounters={encounterList}
          />
        </section>
      ) : (
        <LockedStep n={4} label="Bracket — complete steps 1–3 first" />
      )}
    </div>
  );
}
