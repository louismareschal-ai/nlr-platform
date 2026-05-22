import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

// Country flag helper — uses Unicode flag emoji
function countryFlag(code: string | null) {
  if (!code || code.length !== 2) return null;
  const offset = 127397;
  return String.fromCodePoint(...code.toUpperCase().split("").map((c) => c.charCodeAt(0) + offset));
}

interface SearchProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function PlayersPage({ searchParams }: SearchProps) {
  const { q } = await searchParams;
  const supabase = createServiceClient();

  // Try athlete_profiles first (full scrapped data); fall back to players table
  const { data: profileData, error: profileError } = await supabase
    .from("athlete_profiles")
    .select("id, playerzone_id, first_name, last_name, country, club, photo_url, total_wins, total_losses, gender")
    .order("last_name")
    .limit(200);

  const hasAthleteProfiles = !profileError;

  let athletes: typeof profileData | Array<{ id: string; first_name: string; last_name: string; photo_url: string | null; total_wins: number; total_losses: number; country: string | null; club: string | null; playerzone_id: string | null; gender: string | null }> = profileData ?? [];

  // If athlete_profiles table doesn't exist, fall back to players table
  if (!hasAthleteProfiles) {
    const { data: fallback } = await supabase
      .from("players")
      .select("id, first_name, last_name, photo_url")
      .order("last_name")
      .limit(200);
    athletes = (fallback ?? []).map(p => ({ ...p, total_wins: 0, total_losses: 0, country: null, club: null, playerzone_id: null, gender: null }));
  }

  if (q) {
    const term = q.toLowerCase().trim();
    athletes = athletes.filter(
      (p) =>
        p.first_name.toLowerCase().includes(term) ||
        p.last_name.toLowerCase().includes(term) ||
        (p.club ?? "").toLowerCase().includes(term)
    );
  }

  const error = null; // no longer blocking error
  const tableExists = true;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">NLR Open</p>
        <h1 className="text-3xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          Players
        </h1>
      </div>

      {/* Search */}
      <form method="get" className="relative">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name..."
          className="w-full max-w-md px-4 py-2.5 rounded-xl border border-[#1a1a24] bg-[#0d0d12] text-sm text-[#f0ece3] placeholder:text-[#6b6b7a] focus:outline-none focus:border-[#e8b84b]/50"
          autoComplete="off"
        />
      </form>

      {!tableExists || error ? (
        <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-6 text-center">
          <p className="text-sm text-[#6b6b7a]">
            Player profiles are not yet available. Check back after the database is set up.
          </p>
        </div>
      ) : (athletes ?? []).length === 0 ? (
        <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-6 text-center">
          <p className="text-sm text-[#6b6b7a]">
            {q ? `No players found for "${q}".` : "No player profiles yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(athletes ?? []).map((athlete) => {
            // playerzone_id may be stored as a full URL — extract just the numeric segment
            const playerzoneSlug = athlete.playerzone_id
              ? athlete.playerzone_id.split("/").pop()
              : null;

            return (
              <Link
                key={athlete.id}
                href={`/players/${playerzoneSlug ?? athlete.id}`}
                className="group block rounded-xl border border-[#1a1a24] bg-[#0d0d12] hover:border-[#e8b84b]/30 transition-colors overflow-hidden"
              >
                <div className="flex items-start gap-4 p-4">
                  {/* Photo */}
                  <div className="shrink-0 w-14 h-14 rounded-full bg-[#1a1a24] overflow-hidden flex items-center justify-center">
                    {athlete.photo_url ? (
                      <img
                        src={athlete.photo_url}
                        alt={`${athlete.first_name} ${athlete.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xl text-[#6b6b7a]">
                        {athlete.first_name[0]}{athlete.last_name[0]}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm group-hover:text-[#e8b84b] transition-colors">
                        {athlete.first_name} {athlete.last_name}
                      </p>
                      {athlete.country && (
                        <span className="text-lg leading-none" title={athlete.country}>
                          {countryFlag(athlete.country)}
                        </span>
                      )}
                    </div>
                    {athlete.club && (
                      <p className="text-xs text-[#6b6b7a] mt-0.5 truncate">{athlete.club}</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {q && (athletes?.length ?? 0) > 0 && (
        <p className="text-xs text-[#6b6b7a]">
          {athletes?.length} result{athletes?.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
        </p>
      )}
    </div>
  );
}
