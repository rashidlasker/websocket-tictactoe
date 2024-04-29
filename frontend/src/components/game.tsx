"use client";

import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { BoardSpot, Game } from "../../../shared/types";

const socket = io("http://localhost:5000");

const TicTacToeGame: React.FC = () => {
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    socket.emit("joinGame");
    socket.on("setGame", (game: Game) => setGame(game));
    return () => {
      socket.off("setGame");
    };
  }, []);

  const makeMove = (row: number, col: number) => {
    if (game) {
      if (game.nextPlayer !== socket.id) return;
      if (game.board[row][col] !== " ") return;
      if (game.gameState !== "inProgress") return;
      socket.emit("makeMove", { row, col, gameId: game.id });
    }
  };

  const startNewGame = () => {
    if (game && game.gameState !== "inProgress") {
      socket.emit('startNewGame', game);
    }
  };

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      {game ? (
        <div>
          {game.gameState === "inProgress" ? (
            <div>
              {game.nextPlayer === socket.id ? "Your turn" : "Opponent's turn"}
            </div>
          ) : game.gameState === "playerXWon" ? 
            (socket.id === game.players.X ? <div>You won!</div> : <div>Player X won</div>) 
            : game.gameState === "playerOWon" ? 
            (socket.id === game.players.O ? <div>Player O won</div> : <div>You won!</div>)
            : game.gameState === "draw" ? <div>Draw</div> : null}
          <div className="flex flex-col">
            {game &&
              game.board.map((row, i) => (
                <div key={i} className="flex flex-row justify-center">
                  {row.map((cell, j) => (
                    <div
                      key={j}
                      className="w-16 h-16 flex items-center justify-center border border-gray-300"
                      onClick={() => makeMove(i, j)}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
          </div>
          {game.gameState !== "inProgress" && (
            <button onClick={startNewGame}>Start new game</button>
          )}
        </div>
      ) : (
        <div>Waiting for another player...</div>
      )}
    </div>
  );
};

export default TicTacToeGame;
