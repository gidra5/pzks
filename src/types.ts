export type Position = { start: number; end: number };
export type ParsingError = { message: string; pos: Position; cause?: ParsingError[] };
export type ConsumeParsingResult<T> = [result: T, errors: ParsingError[]];
export type ParsingResult<T> = [index: number, ...result: ConsumeParsingResult<T>];
export type Parser<T, S, Consume extends boolean> = (
  src: S,
  i?: number
) => Consume extends true ? ConsumeParsingResult<T> : ParsingResult<T>;
export type StringParser<T, Consume extends boolean = false> = Parser<T, string, Consume>;
export type TokenParser<T, Consume extends boolean = false> = Parser<T, Token[], Consume>;

export type Context = Record<string, any>;

export type Tagged<Type, T, TypeKey extends string = "type"> = {
  [k in TypeKey]: Type;
} & T;
export type TaggedItem<Type, T, TypeKey extends string = "type", ItemKey extends string = "item"> = {
  [k in TypeKey]: Type;
} & { [k in ItemKey]: T };

/**
 * Generates tagged union (`{ type: T } & TypeMap[T]` for every `T in keyof TypeMap`) from a map of types `TypeMap`
 */
export type TaggedUnion<
  TypeMap extends Record<string, unknown>,
  TypeKey extends string = "type",
  U extends keyof TypeMap = keyof TypeMap
> = U extends unknown ? Tagged<U, TypeMap[U], TypeKey> : never;

/**
 * Generates tagged union (`{ type: T, item: TypeMap[T] }` for every `T in keyof TypeMap`) from a map of types `TypeMap`
 */
export type TaggedItemUnion<
  TypeMap extends Record<string, unknown>,
  TypeKey extends string = "type",
  ItemKey extends string = "item",
  U extends keyof TypeMap = keyof TypeMap
> = U extends unknown ? TaggedItem<U, TypeMap[U], TypeKey, ItemKey> : never;

export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never;

export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

export type Token =
  | { type: "identifier"; src: string }
  | { type: "symbol"; src: string }
  | { type: "number"; src: string; value: number }
  | { type: "string"; src: string; value: string };

export type AccessExpression = TaggedItemUnion<{
  name: string;
  value: Expression;
}>[];
export type Expression = Sum;
export type Boolean = [Sum, { type: BooleanOp; item: Sum }[]];
export type Sum = [Product, { type: "+" | "-"; item: Product }[]];
export type Product = [Value, { type: "*" | "/"; item: Value }[]];
export type Prefix = [
  value: Value,
  operator?: {
    type: (typeof PREFIX_OPS)[PrefixOp];
  }
];
export type Value = TaggedItemUnion<{
  num: number;
  bool: boolean;
  str: string;
  name: string;
  expr: Expression;
}>;
export type EvalValue = number | boolean | string;

// years months days hours minutes seconds
export const BOOLEAN_OPS = ["and", "or"] as const;
export const PREFIX_OPS = {
  number: "castNumber",
  string: "castString",
  round: "round",
  ceil: "ceil",
  floor: "floor",
} as const;
export type BooleanOp = (typeof BOOLEAN_OPS)[number];
export type PrefixOp = keyof typeof PREFIX_OPS;
