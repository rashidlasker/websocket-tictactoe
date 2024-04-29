import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { BoardSpot, Game, GameState, Player } from '../../shared/types';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
});

let players: Record<string,Player> = {};
let games: Record<string, Game> = {};

io.on('connection', (socket) => {

  socket.on('joinGame', () => {
    const playerId = socket.id;

    console.log('connected', playerId);
    if (players[playerId]) {
      players[playerId].activeGame = null;
    } else {
      let newPlayer = { id: playerId, activeGame: null };
      players[playerId] = newPlayer;
    }

    let availablePlayer = Object.values(players).find(player => player.activeGame === null && player.id !== socket.id);

    if (availablePlayer) {
      let newGame: Game = {
        id: socket.id + availablePlayer.id,
        players: [socket.id, availablePlayer.id],
        board: [
          [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
          [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
          [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty]
        ],
        nextPlayer: Math.random() > 0.5 ? socket.id : availablePlayer.id,
        gameState: GameState.InProgress
      };
      games[newGame.id] = newGame;
      players[socket.id].activeGame = newGame.id;
      players[availablePlayer.id].activeGame = newGame.id;
      // add players to the game room
      socket.join(availablePlayer.id);
      io.to(availablePlayer.id).emit('gameStart', newGame);
    } else {
      socket.join(playerId)
    }
  });

  // socket.on('makeMove', (player, position, gameState, gameId) => {
  //   let game = games[gameId];
  //   if (!game || game.players.indexOf(player.id) === -1 || !isValidMove(position, gameState)) {
  //     return;
  //   }

  //   game.gameState = gameState;
  //   if (isGameWon(gameState)) {
  //     io.to(gameId).emit('gameWon', player);
  //   } else {
  //     io.to(gameId).emit('gameState', gameState);
  //   }
  // });

  // socket.on('startNewGame', (gameId) => {
  //   let game = games[gameId];
  //   if (!game) {
  //     return;
  //   }

  //   game.board = [
  //     [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
  //     [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty],
  //     [BoardSpot.Empty, BoardSpot.Empty, BoardSpot.Empty]
  //   ];
  //   game.nextPlayer = Math.random() > 0.5 ? game.players[0] : game.players[1];
  //   game.gameState = GameState.InProgress;
  //   io.to(gameId).emit('gameState', null);
  // });

  // socket.on('disconnect', () => {
  //   let player = players[socket.id];
  //   if (player && player.activeGame) {
  //     let game = games[player.activeGame];
  //     if (game) {
  //       game.gameState = 'quitted';
  //       io.to(game.id).emit('gameState', 'quitted');
  //     }
  //   }
  // });
});

server.listen(5000, () => console.log('Server is running on port 5000'));

// function isValidMove(position, gameState) {
//   // Implement your own logic to check if the move is valid
//   return true;
// }

// function isGameWon(gameState) {
//   // Implement your own logic to check if the game is won
//   return false;
// }