import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  setup: "Setup",
  registration: "Registration",
  active: "Live",
  completed: "Completed",
};

const STATUS_COLORS: Record<string, string> = {
  setup: "bg-[#1a1a24] text-[#6b6b7a]",
  registration: "bg-[#1a1a24] text-[#e8b84b]",
  active: "bg-[#e8b84b]/10 text-[#e8b84b] border border-[#e8b84b]/30",
  completed: "bg-[#1a1a24] text-[#6b6b7a]",
};

interface FilterProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function TournamentsPage({ searchParams }: FilterProps) {
  const { status } = await searchParams;
  const supabase = createServiceClient();

  let query = supabase
    .from("tournaments")
    .select(`
      id, name, slug, date, location, status,
      squads(count)
    `)
    .order("date", { ascending: false });

  if (status && ["setup", "registration", "active", "completed"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data: tournaments } = await query;

  const filters = ["all", "active", "registration", "completed"];

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">NLR Open</p>
        <h1 className="text-3xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          Tournaments
        </h1>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/tournaments" : `/tournaments?status=${f}`}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors capitalize ${
              (f === "all" && !status) || f === status
                ? "bg-[#e8b84b] text-[#050508] font-medium"
                : "bg-[#1a1a24] text-[#6b6b7a] hover:text-[#f0ece3]"
            }`}
          >
            {f === "all" ? "All" : STATUS_LABELS[f] ?? f}
          </Link>
        ))}
      </div>

      {/* Tournament cards */}
      {(tournaments ?? []).length === 0 ? (
        <div className="rounded-xl border border-[#1a1a24] bg-[#0d0d12] p-8 text-center">
          <p className="text-sm text-[#6b6b7a]">No tournaments found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(tournaments ?? []).map((t) => {
            const squadCount = (t.squads as unknown as { count: number }[] | null)?.[0]?.count ?? 0;
            return (
              <Link
                key={t.id}
                href={`/tournaments/${t.slug}`}
                className="group block rounded-xl border border-[#1a1a24] bg-[#0d0d12] hover:border-[#e8b84b]/30 transition-colors p-5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h2
                    className="text-lg font-bold group-hover:text-[#e8b84b] transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t.name}
                  </h2>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] ?? "bg-[#1a1a24] text-[#6b6b7a]"}`}
                  >
                    {STATUS_LABELS[t.status] ?? t.status}
                  </span>
                </div>

                <div className="space-y-1 text-sm text-[#6b6b7a]">
                  <p>
                    {new Date(t.date).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  {t.location && <p>{t.location}</p>}
                  <p>{squadCount} squad{squadCount !== 1 ? "s" : ""}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
