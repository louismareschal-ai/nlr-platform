import { notFound } from "next/navigation";
import { matchIdForCourt } from "@/lib/firebase/courts";
import ScoreOverlay from "@/components/overlay/ScoreOverlay";

export const dynamic = "force-dynamic";

export default async function CourtOverlayPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const court = parseInt(n, 10);
  if (!Number.isFinite(court) || court < 1) notFound();

  const matchId = matchIdForCourt(court);
  if (!matchId) notFound();

  return <ScoreOverlay court={court} matchId={matchId} />;
}
