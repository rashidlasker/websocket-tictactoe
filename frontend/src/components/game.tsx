"use client";

import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import { BoardSpot, Game, GameState } from "../../../shared/types";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "./ui/button";

const socket = io("http://localhost:5000");

const TicTacToeGame: React.FC = () => {
  const { toast } = useToast();
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
      if (game.board[row][col] !== " ") return;
      if (game.gameState !== GameState.InProgress) return;
      if (game.nextPlayer !== socket.id) {
        toast({
          variant: "destructive",
          title: "Not your turn.",
          duration: 1000,
        });
        return;
      }
      socket.emit("makeMove", { row, col, gameId: game.id });
    }
  };

  const startNewGame = () => {
    if (game && game.gameState !== GameState.InProgress) {
      socket.emit("startNewGame", game);
    }
  };

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      {game ? (
        <div>
          {game.gameState === GameState.InProgress ? (
            <div>
              {game.nextPlayer === socket.id ? "Your turn" : "Opponent's turn"}
            </div>
          ) : game.gameState === GameState.PlayerXWon ? (
            socket.id === game.players.X ? (
              <div>You won!</div>
            ) : (
              <div>Player X won</div>
            )
          ) : game.gameState === GameState.PlayerOWon ? (
            socket.id === game.players.O ? (
              <div>You won!</div>
            ) : (
              <div>Player O won</div>
            )
          ) : game.gameState === GameState.Draw ? (
            <div>Draw</div>
          ) : null}
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
            <Button onClick={startNewGame}>Start new game</Button>
          )}
        </div>
      ) : (
        <div>Waiting for another player...</div>
      )}
    </div>
  );
};

export default TicTacToeGame;
