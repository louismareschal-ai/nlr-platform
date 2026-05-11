import type { BracketSlot, GameType } from "@/types";
import { BRACKET_LABELS, GAME_LABELS } from "@/lib/tournament/bracket";

const GAME_SHORT: Record<string, string> = {
  mixed1: "M1",
  mixed2: "M2",
  open1: "O1",
  open2: "O2",
  women: "W",
};

const GAME_ORDER = ["mixed1", "mixed2", "open1", "open2", "women"];

interface GameResult {
  game_type: string;
  winner_squad_id: string | null;
  score_status: string;
}

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
  games?: GameResult[];
}

interface BracketViewProps {
  encounters: EncounterCard[];
  linkPrefix?: string;
}

export function BracketView({ encounters, linkPrefix }: BracketViewProps) {
  const bySlot = Object.fromEntries((encounters ?? []).map((e) => [e.bracket_slot, e]));

  return (
    <div className="space-y-10">
      {/* Winners Bracket */}
      <div>
        <p className="text-[10px] font-bold text-[#e8b84b] uppercase tracking-widest mb-4">
          Winners Bracket
        </p>
        <div className="overflow-x-auto">
          <div className="flex gap-5 min-w-max items-start">
            {/* QFs */}
            <div className="flex flex-col gap-3 w-52">
              <p className="label-overline text-center">Quarterfinals</p>
              {(["qf_a", "qf_b", "qf_c", "qf_d"] as BracketSlot[]).map((slot) => (
                <EncounterSlot key={slot} slot={slot} encounter={bySlot[slot]} linkPrefix={linkPrefix} gold={false} />
              ))}
            </div>

            {/* SF Winners */}
            <div className="w-52 mt-14">
              <p className="label-overline text-center mb-3">Semifinals</p>
              <EncounterSlot slot="sf_winners_1" encounter={bySlot["sf_winners_1"]} linkPrefix={linkPrefix} gold />
              <div className="mt-[108px]">
                <EncounterSlot slot="sf_winners_2" encounter={bySlot["sf_winners_2"]} linkPrefix={linkPrefix} gold />
              </div>
            </div>

            {/* Grand Final */}
            <div className="w-52 mt-[172px]">
              <p className="label-overline text-center mb-3">Grand Final</p>
              <EncounterSlot slot="final" encounter={bySlot["final"]} linkPrefix={linkPrefix} gold />
            </div>
          </div>
        </div>
      </div>

      {/* Placement Bracket */}
      <div className="border-t border-[#1a1a24] pt-8">
        <p className="text-[10px] font-bold text-[#6b6b7a] uppercase tracking-widest mb-4">
          Placement Bracket
        </p>
        <div className="overflow-x-auto">
          <div className="flex gap-5 min-w-max items-start">
            {/* SF Placement */}
            <div className="flex flex-col gap-3 w-52">
              <p className="label-overline text-center">5th–8th Semifinals</p>
              <EncounterSlot slot="sf_placement_1" encounter={bySlot["sf_placement_1"]} linkPrefix={linkPrefix} gold={false} />
              <EncounterSlot slot="sf_placement_2" encounter={bySlot["sf_placement_2"]} linkPrefix={linkPrefix} gold={false} />
            </div>

            {/* Placement finals */}
            <div className="w-52 mt-[44px]">
              <p className="label-overline text-center mb-3">Placement Finals</p>
              <div className="flex flex-col gap-3">
                <EncounterSlot slot="third_place" encounter={bySlot["third_place"]} linkPrefix={linkPrefix} gold={false} />
                <EncounterSlot slot="fifth_place" encounter={bySlot["fifth_place"]} linkPrefix={linkPrefix} gold={false} />
                <EncounterSlot slot="seventh_place" encounter={bySlot["seventh_place"]} linkPrefix={linkPrefix} gold={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EncounterSlot({
  slot,
  encounter,
  linkPrefix,
  gold,
}: {
  slot: BracketSlot;
  encounter: EncounterCard | undefined;
  linkPrefix?: string;
  gold: boolean;
}) {
  const label = BRACKET_LABELS[slot];
  const confirmedGames = (encounter?.games ?? []).filter((g) => g.score_status === "confirmed");
  const gamesWonA = confirmedGames.filter((g) => g.winner_squad_id === encounter?.squad_a_id).length;
  const gamesWonB = confirmedGames.filter((g) => g.winner_squad_id === encounter?.squad_b_id).length;
  const hasScore = confirmedGames.length > 0;

  const content = (
    <div
      className={`rounded-xl border p-3 transition-colors
        ${gold ? "border-[#e8b84b]/20 bg-[#13131a]" : "border-[#1a1a24] bg-[#0d0d12]"}
        ${linkPrefix && encounter ? "hover:border-[#e8b84b]/40 cursor-pointer" : ""}
      `}
    >
      <p className="text-[10px] text-[#6b6b7a] mb-2 font-medium uppercase tracking-wide">
        {label}
      </p>

      <SquadRow
        name={encounter?.squad_a?.name ?? "TBD"}
        isWinner={!!encounter?.winner_id && encounter.winner_id === encounter.squad_a_id}
        isLoser={!!encounter?.winner_id && encounter.winner_id !== encounter.squad_a_id}
        gamesWon={hasScore ? gamesWonA : undefined}
      />
      <div className="h-px bg-[#1a1a24] my-1.5" />
      <SquadRow
        name={encounter?.squad_b?.name ?? "TBD"}
        isWinner={!!encounter?.winner_id && encounter.winner_id === encounter.squad_b_id}
        isLoser={!!encounter?.winner_id && encounter.winner_id !== encounter.squad_b_id}
        gamesWon={hasScore ? gamesWonB : undefined}
      />

      {/* Per-game winners */}
      {confirmedGames.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {GAME_ORDER.map((gt) => {
            const game = confirmedGames.find((g) => g.game_type === gt);
            if (!game) return null;
            const wonByA = game.winner_squad_id === encounter?.squad_a_id;
            return (
              <span
                key={gt}
                title={`${GAME_LABELS[gt as GameType]}: ${wonByA ? encounter?.squad_a?.name : encounter?.squad_b?.name}`}
                className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                  wonByA ? "bg-[#e8b84b]/15 text-[#e8b84b]" : "bg-[#6b6b7a]/15 text-[#6b6b7a]"
                }`}
              >
                {GAME_SHORT[gt]}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );

  if (linkPrefix && encounter) {
    return <a href={`${linkPrefix}/${encounter.id}`}>{content}</a>;
  }
  return content;
}

function SquadRow({
  name,
  isWinner,
  isLoser,
  gamesWon,
}: {
  name: string;
  isWinner: boolean;
  isLoser: boolean;
  gamesWon?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span
        className={`text-sm font-medium truncate ${
          isWinner ? "text-[#e8b84b]" : isLoser ? "text-[#6b6b7a] line-through" : "text-[#f0ece3]"
        }`}
      >
        {name}
      </span>
      {gamesWon != null && (
        <span
          className={`text-base font-bold tabular-nums shrink-0 leading-none ${
            isWinner ? "text-[#e8b84b]" : isLoser ? "text-[#6b6b7a]" : "text-[#f0ece3]"
          }`}
        >
          {gamesWon}
        </span>
      )}
    </div>
  );
}
