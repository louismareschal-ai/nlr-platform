import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TournamentSubNav } from "@/components/layout/TournamentSubNav";

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const serviceClient = createServiceClient();

  const { data: tournament } = await serviceClient
    .from("tournaments")
    .select("id, name, slug, status")
    .eq("slug", slug)
    .single();

  if (!tournament) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role: string | null = null;
  let mySquadId: string | null = null;

  if (user) {
    const { data: player } = await supabase
      .from("players")
      .select("role, squad_id")
      .eq("id", user.id)
      .single();
    role = player?.role ?? null;
    mySquadId = player?.squad_id ?? null;
  }

  return (
    <TournamentSubNav
      slug={tournament.slug}
      tournamentName={tournament.name}
      role={role}
      mySquadId={mySquadId}
    >
      {children}
    </TournamentSubNav>
  );
}
