import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";

function countryFlag(code: string | null) {
  if (!code || code.length !== 2) return null;
  const offset = 127397;
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => c.charCodeAt(0) + offset));
}

function countryName(code: string | null) {
  if (!code) return null;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  // Support three ID formats in the URL:
  // - UUID (primary key)
  // - full playerzone URL stored in playerzone_id
  // - numeric tail of a playerzone URL (e.g. "1768" from ".../players/1768")
  let athlete = null;
  let athlError = null;

  const isUUID = /^[0-9a-f-]{36}$/.test(id);

  if (!isUUID) {
    // Try exact match on playerzone_id
    const { data, error } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("playerzone_id", id)
      .maybeSingle();
    athlete = data;
    athlError = error;

    // If not found, the ID is probably the numeric tail (e.g. "1768").
    // Match against playerzone_id ending with /{id}
    if (!athlete && /^\d+$/.test(id)) {
      const { data: d2, error: e2 } = await supabase
        .from("athlete_profiles")
        .select("*")
        .like("playerzone_id", `%/${id}`)
        .maybeSingle();
      athlete = d2;
      athlError = e2;
    }
  }

  if (!athlete) {
    const { data, error } = await supabase
      .from("athlete_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    athlete = data;
    athlError = error;
  }

  if (!athlete) {
    if (athlError && athlError.message.includes("does not exist")) {
      // DB not migrated yet — show placeholder
      return (
        <div className="space-y-6">
          <Link href="/players" className="text-sm text-[#6b6b7a] hover:text-[#f0ece3]">
            ← Back to players
          </Link>
          <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-8 text-center">
            <p className="text-sm text-[#6b6b7a]">Player profiles not yet available.</p>
          </div>
        </div>
      );
    }

    // Fallback: player exists in the platform `players` table but has no
    // PlayerZone-scraped athlete_profile yet. Render a minimal profile with
    // NLR tournament participations.
    if (isUUID) {
      const { data: player, error: playerError } = await supabase
        .from("players")
        .select(`
          id, first_name, last_name, gender, photo_url, playerzone_id, squad_id
        `)
        .eq("id", id)
        .maybeSingle();

      if (playerError) {
        console.error("Player fallback query error:", playerError);
      }

      let squad: { id: string; name: string; seed: number | null; tournaments: { id: string; name: string; slug: string; date: string | null } } | null = null;
      if (player?.squad_id) {
        const { data: squadRow } = await supabase
          .from("squads")
          .select("id, name, seed, tournaments(id, name, slug, date)")
          .eq("id", player.squad_id)
          .maybeSingle();
        squad = squadRow as unknown as typeof squad;
      }

      if (player) {
        const tournament = squad?.tournaments;

        return (
          <div className="space-y-8">
            <Link href="/players" className="text-sm text-[#6b6b7a] hover:text-[#f0ece3] transition-colors">
              ← Back to players
            </Link>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[#1a1a24] overflow-hidden flex items-center justify-center">
                {player.photo_url ? (
                  <img
                    src={player.photo_url}
                    alt={`${player.first_name} ${player.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl text-[#6b6b7a]">
                    {player.first_name[0]}{player.last_name[0]}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h1
                  className="text-4xl font-bold tracking-tight"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {player.first_name} {player.last_name}
                </h1>
                <p className="text-sm text-[#6b6b7a] mt-2 capitalize">{player.gender}</p>
              </div>
            </div>

            {squad && tournament && (
              <div>
                <p className="label-overline mb-3">Current tournament</p>
                <Link
                  href={`/tournaments/${tournament.slug}/squads/${squad.id}`}
                  className="block rounded-xl border border-[#1a1a24] bg-[#0d0d12] hover:border-[#e8b84b]/40 p-4 transition-colors"
                >
                  <p className="text-xs text-[#6b6b7a] mb-1">{tournament.name}</p>
                  <div className="flex items-center gap-2">
                    {squad.seed && (
                      <span className="text-xs font-bold text-[#e8b84b]">#{squad.seed}</span>
                    )}
                    <p className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                      {squad.name}
                    </p>
                    <span className="ml-auto text-xs text-[#6b6b7a]">→</span>
                  </div>
                </Link>
              </div>
            )}
          </div>
        );
      }
    }

    notFound();
  }

  // Load tournament results
  const { data: results } = await supabase
    .from("athlete_tournament_results")
    .select("*")
    .eq("athlete_id", athlete.id)
    .order("tournament_date", { ascending: false });

  const seasons = [...new Set((results ?? []).map((r: { season: string | null }) => r.season).filter(Boolean))].sort().reverse();

  return (
    <div className="space-y-8">
      <Link href="/players" className="text-sm text-[#6b6b7a] hover:text-[#f0ece3] transition-colors">
        ← Back to players
      </Link>

      {/* Hero */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Photo */}
        <div className="shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[#1a1a24] overflow-hidden flex items-center justify-center">
          {athlete.photo_url ? (
            <img
              src={athlete.photo_url}
              alt={`${athlete.first_name} ${athlete.last_name}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl text-[#6b6b7a]">
              {athlete.first_name[0]}{athlete.last_name[0]}
            </span>
          )}
        </div>

        {/* Name + info */}
        <div className="flex-1">
          <h1
            className="text-4xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {athlete.first_name} {athlete.last_name}
          </h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {athlete.country && (
              <span className="flex items-center gap-1.5 text-sm text-[#6b6b7a]">
                <span className="text-xl">{countryFlag(athlete.country)}</span>
                {countryName(athlete.country)}
              </span>
            )}
            {athlete.club && (
              <span className="text-sm text-[#6b6b7a]">{athlete.club}</span>
            )}
          </div>
          {athlete.bio && (
            <p className="mt-3 text-sm text-[#6b6b7a] max-w-prose">{athlete.bio}</p>
          )}
          {athlete.playerzone_url && (
            <a
              href={athlete.playerzone_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-[#e8b84b] hover:underline"
            >
              View on Playerzone →
            </a>
          )}
        </div>
      </div>

      {/* Tournament history */}
      {(results ?? []).length > 0 && (
        <div>
          <h2
            className="text-xl font-bold mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Tournament History
          </h2>

          {/* Group by season */}
          {seasons.map((season) => {
            const seasonResults = (results ?? []).filter((r: { season: string | null }) => r.season === season);
            return (
              <div key={season} className="mb-6">
                <p className="label-overline mb-2">{season}</p>
                <div className="rounded-xl border border-[#1a1a24] overflow-hidden">
                  <div className="hidden sm:grid grid-cols-5 px-4 py-2 text-xs text-[#6b6b7a] border-b border-[#1a1a24] bg-[#0d0d12]">
                    <span className="col-span-2">Tournament</span>
                    <span>Division</span>
                    <span>Placement</span>
                    <span>Points</span>
                  </div>
                  {seasonResults.map((r: {
                    id: string;
                    tournament_name: string;
                    tournament_date: string | null;
                    division: string | null;
                    placement: number | null;
                    points_earned: number | null;
                    team_name: string | null;
                    source_url: string | null;
                  }) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-2 sm:grid-cols-5 px-4 py-3 border-b border-[#1a1a24] last:border-0 bg-[#0d0d12] hover:bg-[#13131a] transition-colors"
                    >
                      <div className="col-span-2">
                        <p className="text-sm font-medium">{r.tournament_name}</p>
                        {r.tournament_date && (
                          <p className="text-xs text-[#6b6b7a]">
                            {new Date(r.tournament_date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        )}
                        {r.team_name && (
                          <p className="text-xs text-[#6b6b7a]">w/ {r.team_name}</p>
                        )}
                      </div>
                      <div className="text-sm capitalize text-[#6b6b7a]">{r.division ?? "—"}</div>
                      <div className="text-sm">
                        {r.placement ? (
                          <span className={r.placement <= 3 ? "text-[#e8b84b] font-bold" : "text-[#f0ece3]"}>
                            {ordinal(r.placement)}
                          </span>
                        ) : "—"}
                      </div>
                      <div className="text-sm text-[#6b6b7a]">
                        {r.points_earned != null ? r.points_earned : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Results without season */}
          {(() => {
            const noSeason = (results ?? []).filter((r: { season: string | null }) => !r.season);
            if (!noSeason.length) return null;
            return (
              <div className="mb-6">
                <p className="label-overline mb-2">Other</p>
                <div className="rounded-xl border border-[#1a1a24] overflow-hidden">
                  {noSeason.map((r: {
                    id: string;
                    tournament_name: string;
                    tournament_date: string | null;
                    division: string | null;
                    placement: number | null;
                    points_earned: number | null;
                  }) => (
                    <div key={r.id} className="px-4 py-3 border-b border-[#1a1a24] last:border-0 bg-[#0d0d12]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{r.tournament_name}</p>
                          <p className="text-xs text-[#6b6b7a]">{r.division ?? ""}</p>
                        </div>
                        {r.placement && (
                          <span className={`text-sm font-bold ${r.placement <= 3 ? "text-[#e8b84b]" : ""}`}>
                            {ordinal(r.placement)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

