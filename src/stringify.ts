import {
  AccessExpression,
  Boolean,
  Expression,
  Prefix,
  Product,
  Sum,
  Token,
  Value,
} from "./types";

export const stringifyToken = (item: Token): string => {
  return item.src;
};

export const stringifyAccessExpression = (item: AccessExpression): string => {
  return item
    .map((item) => {
      if (item.type === "name") return item.item;
      return `\\(${stringifyExpression(item.item)})`;
    })
    .join(".");
};
export const stringifyExpression = (item: Expression): string => {
  return stringifySum(item);
  // return stringifyBoolean(item);
};
export const stringifyBoolean = (item: Boolean): string => {
  const [head, rest] = item;
  const headStringified = stringifySum(head);
  const restStringified = rest.reduce((acc, item) => {
    return acc + item.type + stringifySum(item.item);
  }, ``);
  return headStringified + restStringified;
};
export const stringifySum = (item: Sum): string => {
  const [head, rest] = item;
  const headStringified = stringifyProduct(head);
  const restStringified = rest.reduce((acc, item) => {
    return acc + item.type + stringifyProduct(item.item);
  }, ``);
  return headStringified + restStringified;
};
export const stringifyProduct = (item: Product): string => {
  const [head, rest] = item;
  const headStringified = stringifyValue(head);
  const restStringified = rest.reduce((acc, item) => {
    // return acc + item.type + stringifyPrefix(item.item);
    return acc + item.type + stringifyValue(item.item);
  }, "");
  return headStringified + restStringified;
};
export const stringifyPrefix = (item: Prefix): string => {
  const [value, operator] = item;
  const valueStringified = stringifyValue(value);
  if (operator) return operator.type + valueStringified;
  return valueStringified;
};
export const stringifyValue = (item: Value): string => {
  if (item.type === "bool") return item.item.toString();
  if (item.type === "num") return item.item.toString();
  if (item.type === "str") return `"${item.item}"`;
  // if (item.type === "name") return stringifyAccessExpression(item.item);
  if (item.type === "name") return item.item;
  return `(${stringifyExpression(item.item)})`;
};
