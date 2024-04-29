export interface Player {
  id: string;
  activeGame: string | null;
}

export enum GameState {
  InProgress = "inProgress",
  PlayerXWon = "playerXWon",
  PlayerOWon = "playerOWon",
  Draw = "draw",
  Quit = "quit",
}

export enum Marker {
  Empty = " ",
  X = "X",
  O = "O",
}

// Game state must be one of the following:
export interface Game {
  id: number;
  room: string;
  playerX: string;
  playerO: string;
  board: Board;
  nextPlayer: Marker.X | Marker.O;
  gameState: GameState;
}

type Row = [Marker, Marker, Marker];
type Board = [Row, Row, Row];
