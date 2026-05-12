interface PlayerPointsEditorProps {
  pointsId: string;
  mixedPoints: number;
  openPoints: number;
  womenPoints: number;
}

export function PlayerPointsEditor({
  mixedPoints,
  openPoints,
  womenPoints,
}: PlayerPointsEditorProps) {
  return (
    <span className="text-xs text-[#6b6b7a] tabular-nums" title="Points synced from Playerzone">
      <span className="text-[#e8b84b]">{mixedPoints}</span>M ·{" "}
      <span className="text-[#e8b84b]">{openPoints}</span>O ·{" "}
      <span className="text-[#e8b84b]">{womenPoints}</span>W
    </span>
  );
}
