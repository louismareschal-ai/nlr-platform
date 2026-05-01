"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function CreateTournamentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    date: "",
    location: "",
    courts_count: "12",
  });

  function setField(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-generate slug from name
      if (field === "name") {
        next.slug = value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.date || !form.slug) {
      setError("Name, date, and slug are required.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { data, error: err } = await supabase
      .from("tournaments")
      .insert({
        name: form.name,
        slug: form.slug,
        date: form.date,
        location: form.location || null,
        courts_count: parseInt(form.courts_count) || 12,
        status: "setup",
      })
      .select("id")
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push(`/super-admin/tournaments/${data.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <div className="space-y-4">
          <Input
            id="name"
            label="Tournament name"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="NLR 2026"
            required
          />
          <Input
            id="slug"
            label="URL slug"
            value={form.slug}
            onChange={(e) => setField("slug", e.target.value)}
            placeholder="nlr-2026"
            required
          />
          <Input
            id="date"
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            required
          />
          <Input
            id="location"
            label="Location"
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="Mannheim, Germany"
          />
          <Input
            id="courts_count"
            label="Number of courts"
            type="number"
            min={1}
            max={30}
            value={form.courts_count}
            onChange={(e) => setField("courts_count", e.target.value)}
          />
        </div>
      </Card>

      {error && <p className="text-sm text-[#f87171]">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          Create tournament
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/super-admin")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
