import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default async function SuperAdminSchedulePage() {
  const supabase = await createClient();

  const { data: rounds } = await supabase
    .from("rounds")
    .select("*, tournaments(name)")
    .order("round_number");

  return (
    <div className="space-y-6">
      <div>
        <p className="label-overline">Super Admin</p>
        <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
          Schedule
        </h1>
      </div>

      {(rounds ?? []).length === 0 ? (
        <Card>
          <p className="text-sm text-[#6b6b7a]">
            No rounds scheduled yet. Set up a tournament and generate the schedule from the tournament page.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {(rounds ?? []).map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-xs text-[#6b6b7a] mt-0.5">
                    {(r.tournaments as { name: string } | null)?.name}
                  </p>
                  {r.scheduled_start && (
                    <p className="text-sm text-[#f0ece3] mt-1">
                      {new Date(r.scheduled_start).toLocaleString("en-GB", {
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    r.status === "completed" ? "neutral"
                    : r.status === "active" ? "success"
                    : "neutral"
                  }
                >
                  {r.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
