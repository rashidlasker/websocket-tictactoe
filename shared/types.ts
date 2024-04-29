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
  id: string;
  room: string;
  players: {
    [Marker.PlayerX]: string;
    [Marker.PlayerO]: string;
  };
  board: Marker[][];
  nextPlayer: string;
  gameState: GameState;
}
