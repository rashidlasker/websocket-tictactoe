import { Game } from "./game";

export interface ServerToClientEvents {
  setGame: (game: Game) => void;
}

export interface ClientToServerEvents {
  joinLobby: () => void;
  makeMove: ({
    row,
    col,
    gameId,
  }: {
    row: number;
    col: number;
    gameId: string;
  }) => void;
  startNewGame: (game: Game) => void;
  disconnect: () => void;
}
