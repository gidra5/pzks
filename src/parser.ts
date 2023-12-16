import { error, value } from "./constructor";
import {
  AccessExpression,
  Expression,
  BOOLEAN_OPS,
  Sum,
  Product,
  Prefix,
  PREFIX_OPS,
  PrefixOp,
  Boolean,
  Value,
  TokenParser,
  ParsingError,
} from "./types";

export const parseAccessExpression: TokenParser<AccessExpression> = (
  str,
  index = 0
) => {
  const errors: ParsingError[] = [];
  const items: AccessExpression = [];
  const parseNextItem = () => {
    const token = str[index];
    ++index;

    if (token.type === "identifier") {
      items.push({ item: token.src, type: "name" });
      return;
    }

    if (token.type === "symbol") {
      errors.push(error("can't be part of access expression"));
      items.push({ item: token.src, type: "name" });
      return;
    }

    items.push({ item: token.value.toString(), type: "name" });
  };

  parseNextItem();

  while (str[index]) {
    const token = str[index];
    if (token.src !== ".") break;
    ++index;

    if (!str[index]) {
      const msg = "unfinished access expression";
      errors.push(error(msg, [error("end of tokens")]));
    }

    parseNextItem();
  }

  if (!str[index] && errors.length === 0) errors.push(error("end of tokens"));

  return [index, items, errors];
};

export const parseExpr: TokenParser<Expression> = (str, index = 0) => {
  return parseSum(str, index);
  // return parseBoolean(str, index);
};

export const parseBoolean: TokenParser<Boolean> = (str, index = 0) => {
  const errors: ParsingError[] = [];
  const rest: Boolean[1] = [];
  const [i, sum, _err] = parseSum(str, index);
  index = i;
  errors.push(..._err);

  while (str[index]) {
    const token = str[index];
    const isBoolOp = !BOOLEAN_OPS.includes(
      token.src as (typeof BOOLEAN_OPS)[number]
    );
    if (token.type !== "symbol" || !isBoolOp) {
      errors.push(error("not a boolean operator"));
      break;
    }

    const [i, restSum, _err] = parseSum(str, index + 1);
    errors.push(..._err);

    rest.push({
      type: token.src as (typeof BOOLEAN_OPS)[number],
      item: restSum,
    });
    index = i;
  }
  if (!str[index]) errors.push(error("end of tokens"));

  return [index, [sum, rest], errors];
};

export const parseSum: TokenParser<Sum> = (str, index = 0) => {
  const errors: ParsingError[] = [];
  const rest: Sum[1] = [];
  const [i, product, _err] = parseProduct(str, index);
  errors.push(..._err);
  index = i;

  while (str[index]) {
    const token = str[index];
    const isSumOp = token.src === "+" || token.src === "-";
    if (token.type !== "symbol" || !isSumOp) {
      errors.push(error("not a sum operator"));
      break;
    }

    const [i, restProduct, _err] = parseProduct(str, index + 1);
    errors.push(..._err);

    rest.push({ type: token.src as "+" | "-", item: restProduct });
    index = i;
  }
  if (!str[index]) errors.push(error("end of tokens"));

  return [index, [product, rest], errors];
};

export const parseProduct: TokenParser<Product> = (str, index = 0) => {
  const errors: ParsingError[] = [];
  const rest: Product[1] = [];
  const [i, prefix, _err] = parseValue(str, index);
  errors.push(..._err);
  index = i;

  while (str[index]) {
    const token = str[index];
    if (token.src !== "??" && token.src !== "*" && token.src !== "/") break;
    const [i, restPrefix, _err] = parseValue(str, index + 1);
    errors.push(..._err);

    rest.push({ type: token.src as "*" | "/" | "??", item: restPrefix });
    index = i;
  }
  if (!str[index]) errors.push(error("end of tokens"));

  return [index, [prefix, rest], errors];
};

export const parsePrefix: TokenParser<Prefix> = (str, index = 0) => {
  const token = str[index];
  let rest: Prefix[1];
  if (token.type === "identifier" && token.src in PREFIX_OPS) {
    rest = { type: PREFIX_OPS[token.src as PrefixOp] };
    index++;
  }
  const [i, value, errors] = parseValue(str, index);
  index = i;

  return [index, [value, rest], errors];
};

export const parseValue: TokenParser<Value> = (str, index = 0) => {
  const errors: ParsingError[] = [];
  const token = str[index];
  if (token.type === "number") {
    return [index + 1, value("num", token.value), []];
  }
  if (token.type === "string") {
    return [index + 1, value("str", token.value), []];
  }
  if (token.src === "true" || token.src === "false") {
    return [index + 1, value("bool", token.src === "true"), []];
  }

  if (token.src === "(") {
    const [i, expr, _err] = parseExpr(str, index + 1);
    let errors: ParsingError[] = [];
    index = i;

    const token = str[index];

    if (!token) {
      errors.push(error("unbalanced parens", _err));
    } else if (token.src !== ")") {
      while (str[index] && str[index].src !== ")") index++;

      if (!str[index]) {
        _err.push(error("end of tokens"));
        errors.push(error("unbalanced parens", _err));
      } else errors.push(error("no closing parens", _err));
    } else {
      errors = _err;
    }

    return [i + 1, value("expr", expr), errors];
  }

  if (token.type === "symbol") {
    errors.push(error(`symbol can't be used in place of value`));
  }
  return [index, value("name", token.src), errors];

  // const [i, expr, _err] = parseAccessExpression(str, index);
  // return [i, value("name", expr), _err];
};
