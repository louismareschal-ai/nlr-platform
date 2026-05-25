"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TournamentSubNavProps {
  slug: string;
  tournamentName: string;
  role: string | null;
  mySquadId: string | null;
  children: React.ReactNode;
}

export function TournamentSubNav({
  slug,
  tournamentName,
  role,
  mySquadId,
  children,
}: TournamentSubNavProps) {
  const pathname = usePathname();
  const base = `/tournaments/${slug}`;

  const tabs = [
    { href: `${base}/bracket`, label: "Bracket", shortLabel: "Bracket" },
    { href: `${base}/schedule`, label: "Schedule", shortLabel: "Schedule" },
    { href: `${base}/squads`, label: "Squads", shortLabel: "Squads" },
    ...(role === "squad_admin" || role === "super_admin"
      ? [{ href: `${base}/my-squad`, label: "My Squad", shortLabel: "Squad" }]
      : []),
    ...(role === "super_admin"
      ? [{ href: `${base}/manage`, label: "Manage", shortLabel: "Manage" }]
      : []),
  ];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Tournament name strip */}
      <div className="border-b border-[#1a1a24] bg-[#0d0d12]">
        <div className="max-w-6xl mx-auto px-4">
          {/* Sub-nav tabs */}
          <div className="flex overflow-x-auto gap-1 pt-1">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive(tab.href)
                    ? "border-[#e8b84b] text-[#f0ece3]"
                    : "border-transparent text-[#6b6b7a] hover:text-[#f0ece3]"
                }`}
              >
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
