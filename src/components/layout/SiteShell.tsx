"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface SiteShellProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export function SiteShell({ children, isAuthenticated }: SiteShellProps) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-[#1a1a24] bg-[#0d0d12] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/tournaments"
              className="text-lg font-bold tracking-tight text-[#e8b84b]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NLR Open
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <NavLink href="/tournaments">Tournaments</NavLink>
              <NavLink href="/players">Players</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={signOut}
                className="text-sm text-[#6b6b7a] hover:text-[#f0ece3] transition-colors"
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/login"
                className="text-sm text-[#6b6b7a] hover:text-[#f0ece3] transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="sm:hidden flex border-b border-[#1a1a24] px-2">
          <Link href="/tournaments" className="px-3 py-2 text-sm text-[#6b6b7a] hover:text-[#f0ece3]">
            Tournaments
          </Link>
          <Link href="/players" className="px-3 py-2 text-sm text-[#6b6b7a] hover:text-[#f0ece3]">
            Players
          </Link>
        </nav>
      </header>

      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-md text-sm text-[#6b6b7a] hover:text-[#f0ece3] hover:bg-[#1a1a24]/50 transition-colors"
    >
      {children}
    </Link>
  );
}
