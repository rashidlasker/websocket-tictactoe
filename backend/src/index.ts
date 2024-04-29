import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { Marker, Game, GameState, Player } from "../../shared/game";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../../shared/socket";

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let allPlayers: Record<string, Player> = {};
let games: Record<string, Game> = {};

io.on("connection", (socket) => {
  socket.on("joinLobby", () => {
    const playerId = socket.id;

    if (allPlayers[playerId]) {
      allPlayers[playerId].activeGame = null;
    } else {
      let newPlayer = { id: playerId, activeGame: null };
      allPlayers[playerId] = newPlayer;
    }

    let availablePlayer = Object.values(allPlayers).find(
      (player) => player.activeGame === null && player.id !== socket.id
    );

    if (availablePlayer) {
      const players =
        Math.random() > 0.5
          ? {
              [Marker.PlayerX]: socket.id,
              [Marker.PlayerO]: availablePlayer.id,
            }
          : {
              [Marker.PlayerX]: availablePlayer.id,
              [Marker.PlayerO]: socket.id,
            };
      let newGame: Game = {
        id: socket.id + availablePlayer.id,
        room: availablePlayer.id,
        players,
        board: [
          [Marker.Empty, Marker.Empty, Marker.Empty],
          [Marker.Empty, Marker.Empty, Marker.Empty],
          [Marker.Empty, Marker.Empty, Marker.Empty],
        ],
        nextPlayer: players[Marker.PlayerX],
        gameState: GameState.InProgress,
      };
      games[newGame.id] = newGame;
      allPlayers[socket.id].activeGame = newGame.id;
      allPlayers[availablePlayer.id].activeGame = newGame.id;
      // add players to the game room
      socket.join(availablePlayer.id);
      io.to(availablePlayer.id).emit("setGame", newGame);
    } else {
      socket.join(playerId);
    }
  });

  socket.on("makeMove", ({ row, col, gameId }) => {
    let game = games[gameId];
    const playerID = socket.id;
    if (
      !game ||
      game.gameState !== GameState.InProgress ||
      game.nextPlayer !== playerID ||
      (game.players[Marker.PlayerX] !== playerID &&
        game.players[Marker.PlayerO] !== playerID) ||
      !isValidMove(playerID, row, col, game)
    ) {
      return;
    }

    game.board[row][col] =
      game.nextPlayer === game.players[Marker.PlayerX]
        ? Marker.PlayerX
        : Marker.PlayerO;
    if (isGameWon(game)) {
      game.gameState =
        game.nextPlayer === game.players[Marker.PlayerX]
          ? GameState.PlayerXWon
          : GameState.PlayerOWon;
    }
    game.nextPlayer =
      game.nextPlayer === game.players[Marker.PlayerX]
        ? game.players[Marker.PlayerO]
        : game.players[Marker.PlayerX];

    io.to(game.room).emit("setGame", game);
  });

  socket.on("startNewGame", (game) => {
    if (!game) {
      return;
    }
    const playerX =
      Math.random() > 0.5
        ? game.players[Marker.PlayerX]
        : game.players[Marker.PlayerO];
    const playerO =
      playerX === game.players[Marker.PlayerX]
        ? game.players[Marker.PlayerO]
        : game.players[Marker.PlayerX];
    let newGame: Game = {
      id: game.id,
      room: game.room,
      players: {
        [Marker.PlayerX]: playerX,
        [Marker.PlayerO]: playerO,
      },
      board: [
        [Marker.Empty, Marker.Empty, Marker.Empty],
        [Marker.Empty, Marker.Empty, Marker.Empty],
        [Marker.Empty, Marker.Empty, Marker.Empty],
      ],
      nextPlayer: playerX,
      gameState: GameState.InProgress,
    };
    games[newGame.id] = newGame;
    io.to(game.room).emit("setGame", newGame);
  });

  socket.on("disconnect", () => {
    let player = allPlayers[socket.id];
    if (player && player.activeGame) {
      let game = games[player.activeGame];
      if (game && game.gameState === GameState.InProgress) {
        game.gameState = GameState.Quit;
      }
      player.activeGame = null;
    }
  });
});

server.listen(5000, () => console.log("Server is running on port 5000"));

function isValidMove(playerID: string, row: number, col: number, game: Game) {
  return game.nextPlayer === playerID && game.board[row][col] === Marker.Empty;
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
