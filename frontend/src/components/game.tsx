"use client";

import React, { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Marker, Game, GameState } from "../../../shared/game";
import { ServerToClientEvents, ClientToServerEvents } from "../../../shared/socket";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "./ui/button";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:5000");

const TicTacToeGame: React.FC = () => {
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    socket.emit("joinLobby");
    socket.on("updateGame", (game: Game) => setGame(game));
    return () => {
      socket.off("updateGame");
    };
  }, []);

  const makeMove = (row: number, col: number) => {
    if (game) {
      if (game.board[row][col] !== Marker.Empty) return;
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

  const message = useMemo(() => {
    if (!game) return "Waiting for another player...";
    if (game.gameState === GameState.InProgress) {
      return game.nextPlayer === socket.id ? "Your turn" : "Opponent's turn";
    }
    if (game.gameState === GameState.PlayerXWon) {
      return socket.id === game.players[Marker.PlayerX]
        ? "You won!"
        : "Player X won";
    }
    if (game.gameState === GameState.PlayerOWon) {
      return socket.id === game.players[Marker.PlayerO]
        ? "You won!"
        : "Player O won";
    }
    if (game.gameState === GameState.Draw) {
      return "Draw";
    }
  }, [game]);

  return (
    <div>
      <h1>Tic Tac Toe</h1>
      {message && <div>{message}</div>}
      {!!game && (
        <div>
          <div className="flex flex-col">
            {game.board.map((row, i) => (
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
          {game.gameState !== GameState.InProgress && (
            <Button onClick={startNewGame}>Start new game</Button>
          )}
        </div>
      )}
    </div>
  );
};

export default TicTacToeGame;
