"use client";

import React, { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Marker, Game, GameState } from "../../../shared/game";
import {
  ServerToClientEvents,
  ClientToServerEvents,
} from "../../../shared/socket";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "./ui/button";
import { twMerge } from "tailwind-merge";

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
  "http://localhost:5000"
);

const TicTacToeGame: React.FC = () => {
  const myPlayerId = socket.id;
  const { toast } = useToast();
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    socket.emit("joinLobby");
    socket.on("updateGame", (game: Game) => setGame(game));
    return () => {
      socket.off("updateGame");
    };
  }, []);

  const isMyTurn = useMemo(() => {
    return (
      game &&
      ((game.nextPlayer === Marker.X && myPlayerId === game.playerX) ||
        (game.nextPlayer === Marker.O && myPlayerId === game.playerO))
    );
  }, [game, myPlayerId]);

  const isSpaceSelectable = (row: number, col: number) => {
    return (
      game &&
      game.board[row][col] === Marker.Empty &&
      game.gameState === GameState.InProgress &&
      isMyTurn
    );
  };

  const makeMove = (row: number, col: number) => {
    if (game) {
      if (!isMyTurn) {
        toast({
          variant: "destructive",
          title: "Not your turn.",
          duration: 1000,
        });
        return;
      }
      if (!isSpaceSelectable(row, col)) return;
      socket.emit("makeMove", { row, col, gameId: game.id });
    }
  };

  const startNewGame = () => {
    if (game && game.gameState !== GameState.InProgress) {
      setGame(null);
      socket.emit("joinLobby");
    }
  };

  const message = useMemo(() => {
    if (!game) return "Waiting for another player...";
    if (game.gameState === GameState.InProgress) {
      return game.nextPlayer === Marker.X && game.playerX === socket.id
        ? "Your turn"
        : "Opponent's turn";
    } else if (game.gameState === GameState.Quit) {
      return "Opponent left the game";
    } else if (game.gameState === GameState.PlayerXWon) {
      return socket.id === game.playerX ? "You won!" : "Player X won";
    } else if (game.gameState === GameState.PlayerOWon) {
      return socket.id === game.playerO ? "You won!" : "Player O won";
    } else if (game.gameState === GameState.Draw) {
      return "Draw";
    }
  }, [game]);

  return (
    <div className="flex flex-col justify-center gap-4">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Tic Tac Toe
      </h1>
      {message && <div>{message}</div>}
      {!!game && (
        <>
          <div>
            <div className="flex flex-col">
              {game.board.map((row, i) => (
                <div key={i} className="flex flex-row justify-center">
                  {row.map((cell, j) => (
                    <div
                      key={j}
                      className={twMerge(
                        "w-16 h-16 flex items-center justify-center border border-gray-300",
                        isSpaceSelectable(i, j)
                          ? "hover:bg-gray-100 cursor-pointer"
                          : ""
                      )}
                      onClick={() => makeMove(i, j)}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          {game.gameState !== GameState.InProgress && (
            <Button onClick={startNewGame}>Play again?</Button>
          )}
        </>
      )}
    </div>
  );
};

export default TicTacToeGame;
