import {
  CartesianProduct,
  AppendList,
  Append,
  Zip,
  Reverse,
  Dedupe,
  UnionToIntersection,
} from "./utils";

export interface Player {
  id: string;
  activeGame: string | null;
}

export enum GameState {
  InProgress = "inProgress",
  PlayerXWon = "playerXWon",
  PlayerOWon = "playerOWon",
  Draw = "draw",
  Quit = "quit",
}

export enum Marker {
  Empty = " ",
  X = "X",
  O = "O",
}

// Game state must be one of the following:
export interface Game {
  id: number;
  room: string;
  playerX: string;
  playerO: string;
  board: Board;
  nextPlayer: Marker.X | Marker.O;
  gameState: GameState;
}

// Changing the board size is as simple as changing the Pos enum and PosList
export enum Pos {
  Zero = 0,
  One = 1,
  Two = 2,
}
export const PosList = [Pos.Zero, Pos.One, Pos.Two] as const;

type Row = Pos;
type Col = Pos;

type Rows = typeof PosList;
type Cols = typeof PosList;

type Coord = [Row, Col];

type WinningRows<
  A extends readonly Pos[],
  B extends readonly Pos[]
> = A extends readonly [infer a extends Pos, ...infer as extends readonly Pos[]]
  ? AppendList<[CartesianProduct<[a], Cols>], WinningRows<as, B>>
  : [];

type WinningCols<
  A extends readonly Pos[],
  B extends readonly Pos[]
> = B extends readonly [infer b extends Pos, ...infer bs extends readonly Pos[]]
  ? AppendList<[CartesianProduct<Rows, [b]>], WinningCols<A, bs>>
  : [];

type WinningDiags = [Zip<Rows, Cols>, Zip<Reverse<Rows>, Cols>];

type WinningGroups = [
  ...WinningRows<Rows, Cols>,
  ...WinningCols<Rows, Cols>,
  ...WinningDiags
];

type TupleToUnion<T extends unknown[]> = T[number];

type WinningCoords = TupleToUnion<WinningGroups>;

type WinningKeySets = CoordsToKeys<WinningCoords>;

type AllCoords = Dedupe<CartesianProduct<Rows, Cols>>;

type TupleToKey<T extends readonly any[]> = `${T[0]}-${T[1]}`;

type CoordsToKeys<C extends Coord[]> = C extends readonly [
  infer head extends Coord,
  ...infer tail extends Coord[]
]
  ? Append<CoordsToKeys<tail>, TupleToKey<head>>
  : [];

type BoardKeys = CoordsToKeys<AllCoords>;
type BoardKey = TupleToUnion<BoardKeys>;

export type Board = { [s in BoardKey]: Marker };

type AvailableMoves<BK extends BoardKey[], B extends Board> = BK extends []
  ? []
  : BK extends [infer head extends BoardKey, ...infer tail extends BoardKey[]]
  ? B[head] extends Marker.Empty
    ? [head, ...AvailableMoves<tail, B>]
    : AvailableMoves<tail, B>
  : BK;

// const test: AvailableMoves<BoardKeys, EmptyBoard> = [];

type GetWinner<B extends Board> = UniqueInSequence<
  LookupCoordinates<WinningKeySets, B>
>;

type LookupCoordinates<C extends Array<BoardKey>, B extends Board> = {
  [Key in keyof C]: B[C[Key]];
};

type UniqueInSequence<P extends Array<unknown>> = P extends Array<unknown>
  ? UnionToIntersection<P[number]>
  : never;

export type ValidGame<B extends Board> =
  | PlayerXWon<B>
  | PlayerOWon<B>
  | Draw<B>
  | InProgress<B>
  | Quit;

type PlayerXWon<B extends Board> = {
  board: B;
  nextPlayer: Marker.X extends GetWinner<B> ? Marker.X : never;
  gameState: GameState.PlayerXWon;
};

type PlayerOWon<B extends Board> = {
  board: B;
  nextPlayer: Marker.O extends GetWinner<B> ? Marker.O : never;
  gameState: GameState.PlayerOWon;
};

type Draw<B extends Board> = {
  board: B;
  nextPlayer: Marker;
  gameState: GameState.Draw;
};

type InProgress<B extends Board> = {
  board: B;
  nextPlayer: Marker;
  gameState: GameState.InProgress;
};

type Quit = {
  gameState: GameState.Quit;
};
