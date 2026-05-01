import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function TournamentsPage() {
  const supabase = await createClient();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-overline">Super Admin</p>
          <h1 className="text-2xl font-bold mt-1" style={{ fontFamily: "var(--font-display)" }}>
            Tournaments
          </h1>
        </div>
        <Link href="/super-admin/tournaments/new">
          <Button>+ New tournament</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {(tournaments ?? []).length === 0 && (
          <Card>
            <p className="text-sm text-[#6b6b7a] text-center py-4">
              No tournaments yet.{" "}
              <Link href="/super-admin/tournaments/new" className="text-[#e8b84b] hover:underline">
                Create your first one.
              </Link>
            </p>
          </Card>
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
                  {` · ${t.courts_count} courts`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={
                    t.status === "active" ? "success"
                    : t.status === "completed" ? "neutral"
                    : t.status === "registration" ? "warning"
                    : "neutral"
                  }
                >
                  {t.status}
                </Badge>
                <Link href={`/super-admin/tournaments/${t.id}`} className="text-sm text-[#e8b84b] hover:underline">
                  Manage →
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
