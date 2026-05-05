// Core domain types for the NLR tournament platform

export type UserRole = "super_admin" | "squad_admin" | "player";
export type Gender = "man" | "woman";
export type TournamentStatus = "setup" | "registration" | "active" | "completed";
export type RoundStatus = "pending" | "active" | "completed";
export type EncounterStatus =
  | "pending"
  | "composition"
  | "mixed_round"
  | "open_round"
  | "scoring"
  | "completed";
export type GameType = "mixed1" | "mixed2" | "open1" | "open2" | "women";
export type ScoreStatus = "pending" | "submitted" | "confirmed" | "disputed";
export type BracketSlot =
  | "qf_a" | "qf_b" | "qf_c" | "qf_d"
  | "sf_winners_1" | "sf_winners_2"
  | "sf_placement_1" | "sf_placement_2"
  | "final" | "third_place" | "fifth_place" | "seventh_place";

export interface Tournament {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string | null;
  status: TournamentStatus;
  courts_count: number;
  created_at: string;
}

export interface Squad {
  id: string;
  tournament_id: string;
  name: string;
  seed: number | null;
  created_at: string;
}

export interface Player {
  id: string;
  squad_id: string | null;
  first_name: string;
  last_name: string;
  gender: Gender;
  role: UserRole;
  temp_password_changed: boolean;
  playerzone_id: string | null;
  created_at: string;
}

export interface PlayerPoints {
  id: string;
  player_id: string;
  tournament_id: string;
  mixed_points: number;
  open_points: number;
  women_points: number;
}

export interface Court {
  id: string;
  tournament_id: string;
  name: string;
  number: number;
}

export interface Round {
  id: string;
  tournament_id: string;
  round_number: number;
  name: string;
  scheduled_start: string | null;
  status: RoundStatus;
}

export interface Encounter {
  id: string;
  round_id: string;
  tournament_id: string;
  squad_a_id: string;
  squad_b_id: string;
  bracket_slot: BracketSlot;
  winner_id: string | null;
  loser_id: string | null;
  squad_a_composition_submitted: boolean;
  squad_b_composition_submitted: boolean;
  composition_revealed: boolean;
  status: EncounterStatus;
}

export interface Composition {
  id: string;
  encounter_id: string;
  squad_id: string;
  mixed1_man_id: string;
  mixed1_woman_id: string;
  mixed2_man_id: string;
  mixed2_woman_id: string;
  open1_player1_id: string;
  open1_player2_id: string;
  open2_player1_id: string;
  open2_player2_id: string;
  submitted_at: string | null;
}

export interface Game {
  id: string;
  encounter_id: string;
  game_type: GameType;
  court_id: string | null;
  encounter_round: 1 | 2; // 1=mixed round, 2=open/women round
  winner_squad_id: string | null;
  score_entered_by: string | null;
  score_entered_at: string | null;
  score_confirmed_by: string | null;
  score_confirmed_at: string | null;
  score_status: ScoreStatus;
  sets: GameSet[];
  status: "pending" | "active" | "completed";
}

export interface GameSet {
  set_number: 1 | 2 | 3;
  score_a: number; // squad_a score
  score_b: number; // squad_b score
}

// Enriched types with relations
export interface EncounterWithSquads extends Encounter {
  squad_a: Squad;
  squad_b: Squad;
  round: Round;
  games: Game[];
  winner?: Squad;
}

export interface PlayerWithPoints extends Player {
  points?: PlayerPoints;
}

export interface CompositionWithPlayers extends Composition {
  mixed1_man: Player;
  mixed1_woman: Player;
  mixed2_man: Player;
  mixed2_woman: Player;
  open1_player1: Player;
  open1_player2: Player;
  open2_player1: Player;
  open2_player2: Player;
}
