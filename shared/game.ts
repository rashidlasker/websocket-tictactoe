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
  PlayerX = "X",
  PlayerO = "O",
}

export interface Game {
  id: number;
  room: string;
  playerX: string;
  playerO: string;
  board: Marker[][];
  nextPlayer: string;
  gameState: GameState;
}
