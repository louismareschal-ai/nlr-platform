import { redirect } from "next/navigation";

export default async function TournamentRoot({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/tournaments/${slug}/bracket`);
}
