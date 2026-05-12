import { createClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/layout/SiteShell";

export default async function PlayersLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <SiteShell isAuthenticated={!!user}>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
    </SiteShell>
  );
}
