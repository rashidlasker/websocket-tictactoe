import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  Marker,
  Game,
  GameState,
  Pos,
  Board,
  PosList,
} from "../../shared/game";
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
      const emptyBoard: Board = PosList.reduce((acc, row) => {
        PosList.forEach((col) => {
          acc[`${row}-${col}`] = Marker.Empty;
        });
        return acc;
      }, {} as Board);
      const newGame = await prisma.game.create({
        data: {
          room: availablePlayer.id,
          playerX,
          playerO,
          board: JSON.stringify(emptyBoard),
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

    const nextGameState = produce(game, (draft: Game) => {
      draft.board[`${row}-${col}`] = draft.nextPlayer;
      if (isGameWon(draft)) {
        draft.gameState =
          draft.nextPlayer === Marker.X
            ? GameState.PlayerXWon
            : GameState.PlayerOWon;
      } else if (
        Object.values(draft.board).filter((cell) => cell === Marker.Empty)
          .length === 0
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
        const updatedGame = await prisma.game.update({
          where: { id: game.id },
          data: { gameState: GameState.Quit },
        });
        io.to(game.room).emit("updateGame", deserializeGame(updatedGame));
      }
    }
  });
});

server.listen(5000, () => console.log("Server is running on port 5000"));

function isValidMove(row: Pos, col: Pos, game: Game) {
  return game.board[`${row}-${col}`] === Marker.Empty;
}

function isGameWon(game: Game) {
  const { board } = game;
  for (let i of PosList) {
    // check rows and columns
    if (
      board[`${i}-${0}`] !== Marker.Empty &&
      PosList.every((j) => board[`${i}-${j}`] === board[`${i}-${0}`])
    ) {
      return true;
    }
    if (
      board[`0-${i}`] !== Marker.Empty &&
      PosList.every((j) => board[`${j}-${i}`] === board[`0-${i}`])
    ) {
      return true;
    }
  }
  // check diagonals
  if (
    board[`${Pos.Zero}-${Pos.Zero}`] !== Marker.Empty &&
    PosList.every(
      (i) => board[`${i}-${i}`] === board[`${Pos.Zero}-${Pos.Zero}`]
    )
  ) {
    return true;
  }
  if (
    board[`${Pos.Zero}-${PosList[PosList.length - 1]}`] !== Marker.Empty &&
    PosList.every(
      (i) =>
        board[`${i}-${PosList[PosList.length - 1 - i]}`] ===
        board[`${Pos.Zero}-${PosList[PosList.length - 1]}`]
    )
  ) {
    return true;
  }
  return false;
}
