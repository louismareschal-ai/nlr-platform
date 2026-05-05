"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

interface NavItem {
  href: string;
  label: string;
}

const navItems: Record<UserRole, NavItem[]> = {
  super_admin: [
    { href: "/super-admin", label: "Dashboard" },
    { href: "/super-admin/tournaments", label: "Tournaments" },
    { href: "/super-admin/bracket", label: "Bracket" },
    { href: "/super-admin/schedule", label: "Schedule" },
    { href: "/super-admin/players", label: "Players" },
  ],
  squad_admin: [
    { href: "/squad-admin", label: "Dashboard" },
    { href: "/squad-admin/composition", label: "Composition" },
    { href: "/squad-admin/scores", label: "Scores" },
    { href: "/squad-admin/schedule", label: "Schedule" },
  ],
  player: [
    { href: "/player", label: "My Schedule" },
    { href: "/player/bracket", label: "Bracket" },
  ],
};

interface AppShellProps {
  role: UserRole;
  children: React.ReactNode;
}

export function AppShell({ role, children }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const items = navItems[role];

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top nav */}
      <header className="border-b border-[#1a1a24] bg-[#0d0d12]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span
              className="text-lg font-bold tracking-tight text-[#e8b84b]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NLR
            </span>
            <nav className="hidden sm:flex items-center gap-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    pathname === item.href
                      ? "bg-[#1a1a24] text-[#f0ece3]"
                      : "text-[#6b6b7a] hover:text-[#f0ece3] hover:bg-[#1a1a24]/50"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-[#6b6b7a] hover:text-[#f0ece3] transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="sm:hidden flex overflow-x-auto border-b border-[#1a1a24] bg-[#0d0d12] px-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 px-3 py-2 text-sm whitespace-nowrap transition-colors ${
              pathname === item.href
                ? "text-[#e8b84b] border-b-2 border-[#e8b84b]"
                : "text-[#6b6b7a]"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
