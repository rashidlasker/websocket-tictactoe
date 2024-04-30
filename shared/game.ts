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

type Append<Tuple, Elem> = Tuple extends readonly [infer head, ...infer tail]
  ? [head, ...Append<tail, Elem>]
  : [Elem];

// const test: Append<[Pos.Zero, Pos.One, Pos.Two], Pos.Two> = [
//   Pos.Zero,
//   Pos.One,
//   Pos.Two,
//   Pos.Two,
// ];

type Reverse<Tuple> = Tuple extends readonly [infer head, ...infer tail]
  ? [...Reverse<tail>, head]
  : [];

// const test: Reverse<Rows> = [Pos.Two, Pos.One, Pos.Zero];

type Coord = [Row, Col];

type AppendList<A extends readonly unknown[], B extends readonly unknown[]> = [
  ...A,
  ...B
];

// const test: AppendList<[[Pos.Zero, Pos.Zero]], [[Pos.Zero, Pos.One]]> = [
//   [Pos.Zero, Pos.Zero],
//   [Pos.Zero, Pos.One],
// ];

type CartesianProduct<
  A extends readonly unknown[],
  B extends readonly unknown[]
> = A extends readonly [
  infer a extends unknown,
  ...infer as extends readonly unknown[]
]
  ? B extends readonly [
      infer b extends unknown,
      ...infer bs extends readonly unknown[]
    ]
    ? AppendList<
        [[a, b]],
        AppendList<CartesianProduct<as, B>, CartesianProduct<A, bs>>
      >
    : []
  : [];

type ListContains<A, B> = A extends readonly [infer head, ...infer tail]
  ? head extends B
    ? true
    : ListContains<tail, B>
  : false;

// const test: ListContains<[Pos.Zero, Pos.One], Pos.Zero> = true;

type Filter<T extends unknown[], F> = T extends []
  ? []
  : T extends readonly [infer head, ...infer tail]
  ? head extends F
    ? Filter<tail, F>
    : [head, ...Filter<tail, F | head>]
  : T;

type Dedupe<T extends unknown[]> = Filter<T, []>;

// const test: Dedupe<[Pos.Zero, Pos.One, Pos.Zero, Pos.One]> = [
//   Pos.Zero,
//   Pos.One,
// ];

// const test: Dedupe<CartesianProduct<[0, 1], [0, 1]>> = [
//   [0, 0],
//   [1, 0],
//   [1, 1],
//   [0, 1],
// ];

type Zip<
  A extends readonly unknown[],
  B extends readonly unknown[]
> = A extends readonly [infer a, ...infer as]
  ? B extends readonly [infer b, ...infer bs]
    ? [[a, b], ...Zip<as, bs>]
    : []
  : [];

// const test: Zip<Rows, Cols> = [
//   [Pos.Zero, Pos.Zero],
//   [Pos.One, Pos.One],
//   [Pos.Two, Pos.Two],
//   [Pos.Three, Pos.Three],
// ];

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

// type EmptyBoard = CartesianProduct<AllCoords, [Marker.Empty]>;

// type Board = CartesianProduct<AllCoords, [Marker]>;
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
