import type { BracketSlot } from "@/types";
import { BRACKET_LABELS } from "@/lib/tournament/bracket";

interface EncounterCard {
  id: string;
  bracket_slot: BracketSlot;
  squad_a: { name: string } | null;
  squad_b: { name: string } | null;
  winner_id: string | null;
  squad_a_id: string | null;
  squad_b_id: string | null;
  status: string;
  round: { name: string };
}

interface BracketViewProps {
  encounters: EncounterCard[];
  linkPrefix?: string; // e.g. "/super-admin/encounters" or "/player/encounters"
}

const COLUMNS: BracketSlot[][] = [
  ["qf_a", "qf_b", "qf_c", "qf_d"],
  ["sf_winners_1", "sf_winners_2", "sf_placement_1", "sf_placement_2"],
  ["final", "third_place", "fifth_place", "seventh_place"],
];

const COLUMN_LABELS = ["Quarterfinals", "Semifinals", "Finals"];

export function BracketView({ encounters, linkPrefix }: BracketViewProps) {
  const bySlot = Object.fromEntries(
    (encounters ?? []).map((e) => [e.bracket_slot, e])
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max">
        {COLUMNS.map((slots, colIdx) => (
          <div key={colIdx} className="flex flex-col gap-4 w-56">
            <p className="label-overline text-center">{COLUMN_LABELS[colIdx]}</p>
            <div
              className={`flex flex-col gap-4 ${
                colIdx === 0 ? "" : colIdx === 1 ? "mt-12" : "mt-24"
              }`}
            >
              {slots.map((slot) => {
                const enc = bySlot[slot];
                const isWinnersPath = ["final", "sf_winners_1", "sf_winners_2"].includes(slot);
                return (
                  <EncounterSlot
                    key={slot}
                    slot={slot}
                    encounter={enc}
                    linkPrefix={linkPrefix}
                    highlight={isWinnersPath}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function EncounterSlot({
  slot,
  encounter,
  linkPrefix,
  highlight,
}: {
  slot: BracketSlot;
  encounter: EncounterCard | undefined;
  linkPrefix?: string;
  highlight: boolean;
}) {
  const label = BRACKET_LABELS[slot];

  const content = (
    <div
      className={`rounded-xl border p-3 transition-colors
        ${highlight ? "border-[#e8b84b]/20 bg-[#13131a]" : "border-[#1a1a24] bg-[#0d0d12]"}
        ${linkPrefix && encounter ? "hover:border-[#e8b84b]/40 cursor-pointer" : ""}
      `}
    >
      <p className="text-[10px] text-[#6b6b7a] mb-2 font-medium uppercase tracking-wide">
        {label}
      </p>
      <SquadRow
        name={encounter?.squad_a?.name ?? "TBD"}
        isWinner={
          encounter?.winner_id != null &&
          encounter.winner_id === encounter.squad_a_id
        }
        isLoser={
          encounter?.winner_id != null &&
          encounter.winner_id !== encounter.squad_a_id
        }
      />
      <div className="h-px bg-[#1a1a24] my-1.5" />
      <SquadRow
        name={encounter?.squad_b?.name ?? "TBD"}
        isWinner={
          encounter?.winner_id != null &&
          encounter.winner_id === encounter.squad_b_id
        }
        isLoser={
          encounter?.winner_id != null &&
          encounter.winner_id !== encounter.squad_b_id
        }
      />
    </div>
  );

  if (linkPrefix && encounter) {
    return (
      <a href={`${linkPrefix}/${encounter.id}`}>{content}</a>
    );
  }
  return content;
}

function SquadRow({
  name,
  isWinner,
  isLoser,
}: {
  name: string;
  isWinner: boolean;
  isLoser: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={`text-sm font-medium truncate ${
          isWinner
            ? "text-[#e8b84b]"
            : isLoser
            ? "text-[#6b6b7a] line-through"
            : "text-[#f0ece3]"
        }`}
      >
        {name}
      </span>
      {isWinner && <span className="text-[#e8b84b] text-xs shrink-0">W</span>}
    </div>
  );
}
