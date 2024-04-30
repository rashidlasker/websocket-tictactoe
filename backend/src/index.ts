import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Marker, Game, GameState } from "../../shared/game";
import { produce } from "immer";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/socket";
import { PrismaClient } from "@prisma/client";
import { deserializeGame } from "./models";

const prisma = new PrismaClient();
const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection", (socket) => {
  socket.on("joinLobby", async () => {
    const playerId = socket.id;

    const existingPlayer = await prisma.user.findUnique({
      where: { id: playerId },
    });
    if (existingPlayer) {
      await prisma.user.update({
        where: { id: playerId },
        data: { activeGameId: null },
      });
    } else {
      try {
        await prisma.user.create({
          data: { id: playerId, activeGameId: null },
        });
      } catch (error) {
        console.log("Error creating user", error);
      }
    }

    const availablePlayer = await prisma.user.findFirst({
      where: { activeGameId: null, id: { not: playerId } },
    });

    if (availablePlayer) {
      const playerX = Math.random() > 0.5 ? socket.id : availablePlayer.id;
      const playerO = playerX === socket.id ? availablePlayer.id : socket.id;

      const newGame = await prisma.game.create({
        data: {
          room: availablePlayer.id,
          playerX,
          playerO,
          board: JSON.stringify([
            [Marker.Empty, Marker.Empty, Marker.Empty],
            [Marker.Empty, Marker.Empty, Marker.Empty],
            [Marker.Empty, Marker.Empty, Marker.Empty],
          ]),
          nextPlayer: Marker.X,
          gameState: GameState.InProgress,
        },
      });

      await prisma.user.update({
        where: { id: playerX },
        data: { activeGameId: newGame.id },
      });
      await prisma.user.update({
        where: { id: playerO },
        data: { activeGameId: newGame.id },
      });
      // add players to the game room
      socket.join(availablePlayer.id);
      io.to(availablePlayer.id).emit("updateGame", deserializeGame(newGame));
    } else {
      socket.join(playerId);
    }
  });

  socket.on("makeMove", async ({ row, col, gameId }) => {
    const rawGame = await prisma.game.findUnique({
      where: { id: gameId },
    });
    if (!rawGame) {
      return;
    }
    const game = deserializeGame(rawGame);
    const playerID = socket.id;
    if (
      !game ||
      game.gameState !== GameState.InProgress ||
      (game.nextPlayer === Marker.X && game.playerX !== playerID) ||
      (game.nextPlayer === Marker.O && game.playerO !== playerID) ||
      (game.playerX !== playerID && game.playerO !== playerID) ||
      !isValidMove(row, col, game)
    ) {
      return;
    }

    const nextGameState = produce(game, (draft) => {
      draft.board[row][col] = draft.nextPlayer;
      if (isGameWon(draft)) {
        draft.gameState =
          draft.nextPlayer === draft.playerX
            ? GameState.PlayerXWon
            : GameState.PlayerOWon;
      } else if (
        draft.board.every((row) => row.every((cell) => cell !== Marker.Empty))
      ) {
        draft.gameState = GameState.Draw;
      }
      draft.nextPlayer = draft.nextPlayer === Marker.X ? Marker.O : Marker.X;
    });

    await prisma.game.update({
      where: { id: gameId },
      data: {
        board: JSON.stringify(nextGameState.board),
        nextPlayer: nextGameState.nextPlayer,
        gameState: nextGameState.gameState,
      },
    });
    io.to(nextGameState.room).emit("updateGame", nextGameState);
  });

  socket.on("disconnect", async () => {
    const player = await prisma.user.findUnique({
      where: { id: socket.id },
    });
    if (player && player.activeGameId) {
      const game = await prisma.game.findUnique({
        where: { id: player.activeGameId },
      });
      if (game && game.gameState === GameState.InProgress) {
        await prisma.game.update({
          where: { id: game.id },
          data: { gameState: GameState.Quit },
        });
        io.to(game.room).emit("updateGame", deserializeGame(game));
      }
    }
  });
});

server.listen(5000, () => console.log("Server is running on port 5000"));

function isValidMove(row: number, col: number, game: Game) {
  return game.board[row][col] === Marker.Empty;
}

function isGameWon(game: Game) {
  const { board } = game;
  for (let i = 0; i < 3; i++) {
    if (
      board[i][0] !== Marker.Empty &&
      board[i][0] === board[i][1] &&
      board[i][0] === board[i][2]
    ) {
      return true;
    }
    if (
      board[0][i] !== Marker.Empty &&
      board[0][i] === board[1][i] &&
      board[0][i] === board[2][i]
    ) {
      return true;
    }
  }
  if (
    board[0][0] !== Marker.Empty &&
    board[0][0] === board[1][1] &&
    board[0][0] === board[2][2]
  ) {
    return true;
  }
  if (
    board[0][2] !== Marker.Empty &&
    board[0][2] === board[1][1] &&
    board[0][2] === board[2][0]
  ) {
    return true;
  }
  return false;
}
