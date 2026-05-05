import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

export default async function SuperAdminDashboard() {
  const supabase = await createClient();

  const [{ data: tournaments }, { data: encounters }, { data: games }] =
    await Promise.all([
      supabase.from("tournaments").select("*").order("date", { ascending: false }),
      supabase.from("encounters").select("id, status, tournament_id"),
      supabase
        .from("games")
        .select("id, score_status, status")
        .eq("score_status", "submitted"),
    ]);

  const pendingConfirmations = games?.length ?? 0;
  const activeEncounters =
    encounters?.filter((e) => e.status === "mixed_round" || e.status === "open_round")
      .length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Super Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          Dashboard
        </h1>
      </div>

      {/* Alert: scores waiting for confirmation */}
      {pendingConfirmations > 0 && (
        <div className="flex items-center gap-3 bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-xl p-4">
          <span className="text-[#fbbf24] text-xl">⚠</span>
          <div>
            <p className="text-sm font-semibold text-[#fbbf24]">
              {pendingConfirmations} score{pendingConfirmations > 1 ? "s" : ""} awaiting
              confirmation
            </p>
            <p className="text-xs text-[#6b6b7a]">
              A squad entered a score — the other squad has not confirmed yet.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Tournaments", value: tournaments?.length ?? 0 },
          { label: "Active encounters", value: activeEncounters },
          { label: "Pending confirmations", value: pendingConfirmations },
          {
            label: "Completed encounters",
            value: encounters?.filter((e) => e.status === "completed").length ?? 0,
          },
        ].map((s) => (
          <Card key={s.label}>
            <p className="text-xs text-[#6b6b7a] mb-1">{s.label}</p>
            <p className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Tournaments list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tournaments</h2>
          <Link
            href="/super-admin/tournaments/new"
            className="text-sm text-[#e8b84b] hover:underline"
          >
            + New tournament
          </Link>
        </div>
        <div className="space-y-3">
          {(tournaments ?? []).length === 0 && (
            <p className="text-sm text-[#6b6b7a]">No tournaments yet.</p>
          )}
          {(tournaments ?? []).map((t) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="text-sm text-[#6b6b7a]">
                    {new Date(t.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {t.location ? ` · ${t.location}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      t.status === "active"
                        ? "success"
                        : t.status === "completed"
                        ? "neutral"
                        : t.status === "registration"
                        ? "warning"
                        : "neutral"
                    }
                  >
                    {t.status}
                  </Badge>
                  <Link
                    href={`/super-admin/tournaments/${t.id}`}
                    className="text-sm text-[#e8b84b] hover:underline"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
