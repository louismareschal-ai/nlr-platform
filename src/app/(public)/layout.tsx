import Link from "next/link";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-[#1a1a24] bg-[#0d0d12]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-[#e8b84b]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NLR Open
            </Link>
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/players"
                className="px-3 py-1.5 rounded-md text-sm text-[#6b6b7a] hover:text-[#f0ece3] hover:bg-[#1a1a24]/50 transition-colors"
              >
                Players
              </Link>
              <Link
                href="/tournaments"
                className="px-3 py-1.5 rounded-md text-sm text-[#6b6b7a] hover:text-[#f0ece3] hover:bg-[#1a1a24]/50 transition-colors"
              >
                Tournaments
              </Link>
            </nav>
          </div>
          <Link
            href="/login"
            className="text-sm text-[#6b6b7a] hover:text-[#f0ece3] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="sm:hidden flex border-b border-[#1a1a24] bg-[#0d0d12] px-2">
        <Link
          href="/players"
          className="px-3 py-2 text-sm text-[#6b6b7a] hover:text-[#f0ece3]"
        >
          Players
        </Link>
        <Link
          href="/tournaments"
          className="px-3 py-2 text-sm text-[#6b6b7a] hover:text-[#f0ece3]"
        >
          Tournaments
        </Link>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>

      <footer className="border-t border-[#1a1a24] py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-[#6b6b7a]">
          NLR Open — The roundnet platform for the community
        </div>
      </footer>
    </div>
  );
}
