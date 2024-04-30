export type Append<Tuple, Elem> = Tuple extends readonly [
  infer head,
  ...infer tail
]
  ? [head, ...Append<tail, Elem>]
  : [Elem];

// const test: Append<[Pos.Zero, Pos.One, Pos.Two], Pos.Two> = [
//   Pos.Zero,
//   Pos.One,
//   Pos.Two,
//   Pos.Two,
// ];

export type Reverse<Tuple> = Tuple extends readonly [infer head, ...infer tail]
  ? [...Reverse<tail>, head]
  : [];

// const test: Reverse<Rows> = [Pos.Two, Pos.One, Pos.Zero];

export type AppendList<
  A extends readonly unknown[],
  B extends readonly unknown[]
> = [...A, ...B];

// const test: AppendList<[[Pos.Zero, Pos.Zero]], [[Pos.Zero, Pos.One]]> = [
//   [Pos.Zero, Pos.Zero],
//   [Pos.Zero, Pos.One],
// ];

export type CartesianProduct<
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

export type ListContains<A, B> = A extends readonly [infer head, ...infer tail]
  ? head extends B
    ? true
    : ListContains<tail, B>
  : false;

// const test: ListContains<[Pos.Zero, Pos.One], Pos.Zero> = true;

export type Filter<T extends unknown[], F> = T extends []
  ? []
  : T extends readonly [infer head, ...infer tail]
  ? head extends F
    ? Filter<tail, F>
    : [head, ...Filter<tail, F | head>]
  : T;

export type Dedupe<T extends unknown[]> = Filter<T, []>;

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

export type Zip<
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

export type UnionToIntersection<U> =
  _PutUnionMembersIntoFunctionArgumentPosition<U> extends (k: infer I) => void
    ? I
    : never;

type _PutUnionMembersIntoFunctionArgumentPosition<U> = U extends any
  ? (k: U) => void
  : never;

export type TupleToUnion<T extends unknown[]> = T[number];

export type UniqueInSequence<P extends Array<unknown>> =
  P extends Array<unknown> ? UnionToIntersection<P[number]> : never;
