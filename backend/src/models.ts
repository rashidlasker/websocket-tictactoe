import { Game as SerializedGame } from "@prisma/client";
import { Game, GameState, Marker } from "../../shared/game";

export const serializeGame = (game: Game): SerializedGame => {
  return {
    id: game.id,
    room: game.room,
    playerX: game.playerX,
    playerO: game.playerO,
    board: JSON.stringify(game.board),
    nextPlayer: game.nextPlayer,
    gameState: game.gameState,
  };
};

export const deserializeGame = (s: SerializedGame): Game => {
  return {
    id: s.id,
    room: s.room,
    playerX: s.playerX,
    playerO: s.playerO,
    board: JSON.parse(s.board),
    nextPlayer: s.nextPlayer as Marker.O | Marker.X,
    gameState: s.gameState as GameState,
  } as Game;
};
