import { Game, Pos } from "./game";

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
    row: Pos;
    col: Pos;
    gameId: number;
  }) => void;
  disconnect: () => void;
}
