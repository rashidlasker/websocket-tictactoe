import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { BoardSpot, Game, GameState, Player } from "../../shared/types";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let players: Record<string, Player> = {};
let games: Record<string, Game> = {};

io.on("connection", (socket) => {
  socket.on("joinGame", () => {
    const playerId = socket.id;

    if (players[playerId]) {
      players[playerId].activeGame = null;
    } else {
      let newPlayer = { id: playerId, activeGame: null };
      players[playerId] = newPlayer;
    }

    let availablePlayer = Object.values(players).find(
      (player) => player.activeGame === null && player.id !== socket.id
    );

    if (availablePlayer) {
      const playerX = Math.random() > 0.5 ? socket.id : availablePlayer.id;
      const playerO = playerX === socket.id ? availablePlayer.id : socket.id;
      let newGame: Game = {
        id: socket.id + availablePlayer.id,
        room: availablePlayer.id,
        players: {
          [BoardSpot.PlayerX]: playerX,
          [BoardSpot.PlayerO]: playerO,
        },
        board: [
          [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
          [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
          [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
        ],
        nextPlayer: playerX,
        gameState: GameState.InProgress,
      };
      games[newGame.id] = newGame;
      players[socket.id].activeGame = newGame.id;
      players[availablePlayer.id].activeGame = newGame.id;
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
      (game.players[BoardSpot.PlayerX] !== playerID &&
        game.players[BoardSpot.PlayerO] !== playerID) ||
      !isValidMove(playerID, row, col, game)
    ) {
      return;
    }

    game.board[row][col] =
      game.nextPlayer === game.players[BoardSpot.PlayerX]
        ? BoardSpot.PlayerX
        : BoardSpot.PlayerO;
    if (isGameWon(game)) {
      game.gameState =
        game.nextPlayer === game.players[BoardSpot.PlayerX]
          ? GameState.PlayerXWon
          : GameState.PlayerOWon;
    }
    game.nextPlayer =
      game.nextPlayer === game.players[BoardSpot.PlayerX]
        ? game.players[BoardSpot.PlayerO]
        : game.players[BoardSpot.PlayerX];
    
    io.to(game.room).emit("setGame", game);
  });

  socket.on('startNewGame', (game) => {
    if (!game) {
      return;
    }
    const playerX = Math.random() > 0.5 ? game.players[BoardSpot.PlayerX] : game.players[BoardSpot.PlayerO];
    const playerO = playerX === game.players[BoardSpot.PlayerX] ? game.players[BoardSpot.PlayerO] : game.players[BoardSpot.PlayerX];
    let newGame: Game = {
      id: game.id,
      room: game.room,
      players: {
        [BoardSpot.PlayerX]: playerX,
        [BoardSpot.PlayerO]: playerO,
      },
      board: [
        [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
        [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
        [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
      ],
      nextPlayer: playerX,
      gameState: GameState.InProgress,
    };
    games[newGame.id] = newGame;
    io.to(game.room).emit("setGame", newGame);
  });

  socket.on('disconnect', () => {
    let player = players[socket.id];
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
  return (
    game.nextPlayer === playerID && game.board[row][col] === BoardSpot.Empty
  );
}

function isGameWon(game: Game) {
  const { board } = game;
  for (let i = 0; i < 3; i++) {
    if (
      board[i][0] !== BoardSpot.Empty &&
      board[i][0] === board[i][1] &&
      board[i][0] === board[i][2]
    ) {
      return true;
    }
    if (
      board[0][i] !== BoardSpot.Empty &&
      board[0][i] === board[1][i] &&
      board[0][i] === board[2][i]
    ) {
      return true;
    }
  }
  if (
    board[0][0] !== BoardSpot.Empty &&
    board[0][0] === board[1][1] &&
    board[0][0] === board[2][2]
  ) {
    return true;
  }
  if (
    board[0][2] !== BoardSpot.Empty &&
    board[0][2] === board[1][1] &&
    board[0][2] === board[2][0]
  ) {
    return true;
  }
  return false;
}
