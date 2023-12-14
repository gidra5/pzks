import {
  AccessExpression,
  Boolean,
  Expression,
  ParsingError,
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

export const prefix = (
  value: Prefix[0],
  operatorType?: NonNullable<Prefix[1]>["type"]
) => [value, ...(operatorType ? [{ type: operatorType }] : [])] as Prefix;

export const value = (type: Value["type"], item: Value["item"]) =>
  ({ type, item } as Value);

export const error = (msg: string, cause?: ParsingError[]): ParsingError => ({
  message: msg,
  cause,
});
