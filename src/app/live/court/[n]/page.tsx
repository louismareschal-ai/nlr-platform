import { notFound } from "next/navigation";
import { matchIdForCourt } from "@/lib/firebase/courts";
import FocusView from "@/components/live/FocusView";

export const dynamic = "force-dynamic";

export default async function FocusPage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const court = parseInt(n, 10);
  if (!Number.isFinite(court) || court < 1) notFound();
  if (!matchIdForCourt(court)) notFound();

  return <FocusView court={court} />;
}
