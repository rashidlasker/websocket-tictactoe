
export interface Player {
    id: string;
    activeGame: string | null;
  }
  
export enum GameState {
    InProgress = 'inProgress',
    PlayerXWon = 'playerXWon',
    PlayerOWon = 'playerOWon',
    Draw = 'draw',
    Quit = 'quit'
}

export enum BoardSpot {
    Empty = ' ',
    PlayerX = 'X',
    PlayerO = 'O'
}

export interface Game {
    id: string;
    players: string[];
    board: BoardSpot[][];
    nextPlayer: string;
    gameState: GameState;
}
