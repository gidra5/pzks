import {
  AccessExpression,
  Context,
  EvalValue,
  Value,
  Prefix,
  Product,
  Sum,
  Expression,
  Boolean,
} from "./types";
import { assert } from "./utils";

export const evalName = (expr: AccessExpression, ctx: Context): EvalValue => {
  const path = evalAccessExpr(expr, ctx);
  const reducer = (acc: Context, path: string[]): EvalValue => {
    if (path.length === 0) return acc as unknown as EvalValue;
    const [name, ...rest] = path;
    return reducer(acc?.[name], rest);
  };
  const res = reducer(ctx, path);
  const isPrimitive =
    typeof res === "string" ||
    typeof res === "number" ||
    typeof res === "boolean" ||
    typeof res === "object" ||
    !res;

  if (!isPrimitive) {
    const pathString = path.join(".");
    const resJSON = JSON.stringify(res);
    const msg = `${pathString} is not a primitive, found value: ${resJSON}`;
    throw new Error(msg);
  }

  return res;
};

export const evalValue = (expr: Value, ctx: Context): EvalValue => {
  if (expr.type === "num" || expr.type === "bool") return expr.item;
  if (expr.type === "str") return expr.item;
  if (expr.type === "expr") return evalExpr(expr.item, ctx);
  return evalName(expr.item, ctx);
};

export const evalPrefix = (expr: Prefix, ctx: Context): EvalValue => {
  const [value, rest] = expr;
  const val = evalValue(value, ctx);

  if (rest) {
    if (rest.type === "castString" && typeof val === "number") return `${val}`;
    if (rest.type === "castString" && typeof val === "string") return `${val}`;
    if (rest.type === "castNumber" && typeof val === "number")
      return Number(val);
    if (rest.type === "castNumber" && typeof val === "string")
      return Number(val);
    if (rest.type === "round" && typeof val === "number")
      return Math.round(val);
    if (rest.type === "ceil" && typeof val === "number") return Math.ceil(val);
    if (rest.type === "floor" && typeof val === "number")
      return Math.floor(val);
    return undefined as unknown as EvalValue;
  }
  return val;
};

export const evalProduct = (expr: Product, ctx: Context): EvalValue => {
  const [value, rest] = expr;
  const val = evalPrefix(value, ctx);

  return rest.reduce((acc, item) => {
    const right = evalPrefix(item.item, ctx);

    if (item.type === "??") return acc ?? right;

    assert(
      typeof right === "number" && typeof acc === "number",
      `* and / are only applicable to numbers, got: ${acc} ${item.type} ${right}`
    );

    if (item.type === "*") return acc * right;
    return acc / right;
  }, val);
};

export const evalSum = (expr: Sum, ctx: Context): EvalValue => {
  const [product, rest] = expr;
  const val = evalProduct(product, ctx);

  return rest.reduce((acc, item) => {
    let right = evalProduct(item.item, ctx);

    if (typeof acc === "string" && !Number.isNaN(Number(acc)))
      acc = Number(acc);
    if (typeof right === "string" && !Number.isNaN(Number(right)))
      right = Number(right);

    if (
      typeof right === "string" &&
      typeof acc === "string" &&
      item.type === "+"
    )
      return acc + right;
    if (
      typeof right === "number" &&
      typeof acc === "number" &&
      item.type === "+"
    )
      return acc + right;
    if (
      typeof right === "number" &&
      typeof acc === "number" &&
      item.type === "-"
    )
      return acc - right;
    throw new Error(
      `cannot apply + or - with different value types, got: ${acc} ${item.type} ${right}`
    );
  }, val);
};

export const evalBoolean = (expr: Boolean, ctx: Context): EvalValue => {
  const [sum, rest] = expr;
  const val = evalSum(sum, ctx);

  return rest.reduce((acc, item) => {
    if (item.type === "and" && !acc) return false;
    if (item.type === "or" && !!acc) return true;
    const right = evalSum(item.item, ctx);

    if (item.type === "and") return !!acc && !!right;
    if (item.type === "or") return !!acc || !!right;
    throw new Error("cant evaluate rule");
  }, val);
};

export const evalExpr = (expr: Expression, ctx: Context): EvalValue => {
  const res = evalBoolean(expr, ctx);
  return res;
};

export const evalAccessExpr = (
  expr: AccessExpression,
  ctx: Context
): string[] => {
  return expr.map((item) => {
    if (item.type === "name") return item.item;

    return evalExpr(item.item, ctx).toString();
  });
};
