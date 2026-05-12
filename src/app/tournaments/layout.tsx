import { createClient } from "@/lib/supabase/server";
import { SiteShell } from "@/components/layout/SiteShell";

export default async function TournamentsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <SiteShell isAuthenticated={!!user}>{children}</SiteShell>;
}
