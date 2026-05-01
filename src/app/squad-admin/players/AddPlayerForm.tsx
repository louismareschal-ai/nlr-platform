"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function AddPlayerForm({ squadId }: { squadId: string }) {
  const router = useRouter();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    gender: "man",
    role: "player",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.email || !form.password || !form.first_name || !form.last_name) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Temporary password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/players/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, squad_id: squadId }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create player.");
    } else {
      setSuccess(`${form.first_name} ${form.last_name} added. They can log in with the temporary password.`);
      setForm({ first_name: "", last_name: "", email: "", password: "", gender: "man", role: "player" });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            value={form.first_name}
            onChange={(e) => setField("first_name", e.target.value)}
            required
          />
          <Input
            label="Last name"
            value={form.last_name}
            onChange={(e) => setField("last_name", e.target.value)}
            required
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setField("email", e.target.value)}
          required
        />
        <Input
          label="Temporary password"
          type="text"
          value={form.password}
          onChange={(e) => setField("password", e.target.value)}
          placeholder="They will change this on first login"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-[#f0ece3] block mb-1.5">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setField("gender", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#1a1a24] bg-[#13131a] text-sm text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
            >
              <option value="man">Man</option>
              <option value="woman">Woman</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[#f0ece3] block mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => setField("role", e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#1a1a24] bg-[#13131a] text-sm text-[#f0ece3] focus:outline-none focus:border-[#e8b84b]/50"
            >
              <option value="player">Player</option>
              <option value="squad_admin">Squad Admin</option>
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-[#f87171]">{error}</p>}
        {success && <p className="text-sm text-[#34d399]">{success}</p>}

        <Button type="submit" loading={loading}>
          Add player
        </Button>
      </form>
    </Card>
  );
}
