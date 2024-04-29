import { Game } from "./game";

export interface ServerToClientEvents {
  updateGame: (game: Game) => void;
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
    gameId: number;
  }) => void;
  disconnect: () => void;
}
