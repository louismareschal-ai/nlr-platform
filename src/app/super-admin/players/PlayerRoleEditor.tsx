"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setPlayerRole, resetPlayerPassword } from "@/app/actions/players";
import type { UserRole } from "@/types";

interface PlayerRoleEditorProps {
  playerId: string;
  currentRole: UserRole;
  playerName: string;
}

const ROLE_LABELS: Record<UserRole, string> = {
  player: "player",
  squad_admin: "squad admin",
  super_admin: "super admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  player: "text-[#6b6b7a]",
  squad_admin: "text-[#e8b84b]",
  super_admin: "text-[#34d399]",
};

export function PlayerRoleEditor({ playerId, currentRole, playerName }: PlayerRoleEditorProps) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(currentRole);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetPassword, setResetPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(newRole: UserRole) {
    if (newRole === role) return;
    setSaving(true);
    setError(null);
    const result = await setPlayerRole(playerId, newRole);
    if (result.success) {
      setRole(newRole);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update role");
    }
    setSaving(false);
  }

  async function handleResetPassword() {
    setResetting(true);
    setError(null);
    setResetPassword(null);
    const result = await resetPlayerPassword(playerId);
    if (result.success && result.password) {
      setResetPassword(result.password);
    } else {
      setError(result.error ?? "Failed to reset password");
    }
    setResetting(false);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={role}
        onChange={(e) => handleRoleChange(e.target.value as UserRole)}
        disabled={saving}
        className={`text-xs px-2 py-1 rounded border border-[#1a1a24] bg-[#13131a] focus:outline-none focus:border-[#e8b84b]/50 ${ROLE_COLORS[role]} disabled:opacity-50`}
        title={`Role for ${playerName}`}
      >
        <option value="player">player</option>
        <option value="squad_admin">squad admin</option>
        <option value="super_admin">super admin</option>
      </select>

      <button
        onClick={handleResetPassword}
        disabled={resetting}
        className="text-xs text-[#6b6b7a] hover:text-[#f0ece3] transition-colors disabled:opacity-50"
        title="Reset password to Test1234!"
      >
        {resetting ? "…" : "↺ pwd"}
      </button>

      {resetPassword && (
        <span className="text-xs text-[#34d399] font-mono">
          pw: {resetPassword}
        </span>
      )}

      {error && <span className="text-xs text-[#f87171]">{error}</span>}
    </div>
  );
}
