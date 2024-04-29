"use client"

import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import { Game } from '../../../shared/types';

const socket = io('http://localhost:5000');

const TicTacToeGame: React.FC = () => {
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    console.log('connecting')
    socket.emit('joinGame');
    socket.on('gameStart', (game: Game) => setGame(game));
    return () => {socket.off('playerInfo').off('gameStart').off('gameState')};
  }, []);

  // const makeMove = (position: number) => {
  //   if (player && gameState) {
  //     socket.emit('makeMove', player, position, gameState, player.activeGame);
  //   }
  // };

  // const startNewGame = () => {
  //   if (player) {
  //     socket.emit('startNewGame', player.activeGame);
  //   }
  // };

  return (
    <div>
      {JSON.stringify(game)}
      <div>
        {Array(9).fill(null).map((_, position) => (
          <button key={position} onClick={() => {}}>
            {/* {gameState && gameState[position]} */} {position}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TicTacToeGame;