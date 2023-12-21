import type {
  AccessExpression,
  Boolean,
  Expression,
  ParsingError,
  Position,
  Pow,
  Prefix,
  Product,
  Sum,
  Token,
  Value,
} from "./types";

export const token = (
  type: Token["type"],
  src: Token["src"],
  value?: number | string
) => ({ type, src, value } as Token);

export const accessExpression = (
  ...parts: [
    type: AccessExpression[number]["type"],
    item: AccessExpression[number]["item"]
  ][]
) => parts.map(([type, item]) => ({ type, item })) as AccessExpression;

// export const expr = (
//   head: Expression[0],
//   ...rest: [
//     type: Expression[1][number]["type"],
//     item: Expression[1][number]["item"]
//   ][]
// ) => bool(head, ...rest) as Expression;

export const expr = (
  head: Expression[0],
  ...rest: [
    type: Expression[1][number]["type"],
    item: Expression[1][number]["item"]
  ][]
) => sum(head, ...rest) as Expression;

export const bool = (
  head: Boolean[0],
  ...rest: [
    type: Boolean[1][number]["type"],
    item: Boolean[1][number]["item"]
  ][]
) => [head, rest.map(([type, item]) => ({ type, item }))] as Boolean;

export const sum = (
  head: Sum[0],
  ...rest: [type: Sum[1][number]["type"], item: Sum[1][number]["item"]][]
) => [head, rest.map(([type, item]) => ({ type, item }))] as Sum;

export const product = (
  head: Product[0],
  ...rest: [
    type: Product[1][number]["type"],
    item: Product[1][number]["item"]
  ][]
) => [head, rest.map(([type, item]) => ({ type, item }))] as Product;

export const pow = (
  head: Pow[0],
  ...rest: [type: Pow[1][number]["type"], item: Pow[1][number]["item"]][]
) => [head, rest.map(([type, item]) => ({ type, item }))] as Pow;

export const prefix = (value: Prefix[0], ...operatorTypes: Prefix[1]) =>
  [value, operatorTypes] as Prefix;

export const value = (type: Value["type"], item: Value["item"]) =>
  ({ type, item } as Value);

export const error = (
  message: string,
  pos: Position,
  cause: ParsingError[] = []
): ParsingError => ({
  message,
  cause,
  pos,
});

export function position(start: number, end: number): Position {
  return { start, end };
}

export function intervalPosition(start: number, length: number): Position {
  return position(start, start + length);
}

export function indexPosition(pos: number): Position {
  return position(pos, pos);
}
