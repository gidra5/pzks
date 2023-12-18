import { position, error, value, intervalPosition, indexPosition, product } from "./constructor";
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

const endOfTokensError = (index: number) => error("end of tokens", indexPosition(index));

export const parseAccessExpression: TokenParser<AccessExpression> = (str, index = 0) => {
  const start = index;
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
      errors.push(error("can't be part of access expression", intervalPosition(index - 1, 1)));
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
      errors.push(error(msg, position(start, index), []));
    }

    parseNextItem();
  }

  if (!str[index] && errors.length === 0) errors.push(endOfTokensError(index));

  return [index, items, errors];
};

export const parseExpr =
  (parens = 0): TokenParser<Expression> =>
  (str, index = 0) => {
    return parseSum(parens)(str, index);
    // return parseBoolean(str, index);
  };

// export const parseBoolean: TokenParser<Boolean> = (str, index = 0) => {
//   const errors: ParsingError[] = [];
//   const rest: Boolean[1] = [];
//   const [i, sum, _err] = parseSum(str, index);
//   index = i;
//   errors.push(..._err);

//   while (str[index]) {
//     const token = str[index];
//     const isBoolOp = !BOOLEAN_OPS.includes(token.src as (typeof BOOLEAN_OPS)[number]);
//     if (token.type !== "symbol" || !isBoolOp) {
//       errors.push(error("not a boolean operator", intervalPosition(index, 1)));
//       break;
//     }

//     const [i, restSum, _err] = parseSum(str, index + 1);
//     errors.push(..._err);

//     rest.push({
//       type: token.src as (typeof BOOLEAN_OPS)[number],
//       item: restSum,
//     });
//     index = i;
//   }
//   if (!str[index]) errors.push(endOfTokensError(index));

//   return [index, [sum, rest], errors];
// };

export const parseSum =
  (parens = 0): TokenParser<Sum> =>
  (str, index = 0) => {
    const errors: ParsingError[] = [];
    const rest: Sum[1] = [];
    const [i, _product, _err] = parseProduct(parens)(str, index);
    errors.push(..._err);
    index = i;

    while (str[index]) {
      const start = index;
      const token = str[index];
      const isSumOp = token.src === "+" || token.src === "-";
      if (token.type !== "symbol" || !isSumOp) {
        break;
      }

      index++;

      if (!str[index]) {
        errors.push(error("missing operand", position(start, index), [endOfTokensError(index)]));
        rest.push({ type: token.src as "+" | "-", item: product(value("name", "_")) });
        break;
      }

      const [i, restProduct, _err] = parseProduct(parens)(str, index);
      errors.push(..._err);

      rest.push({ type: token.src as "+" | "-", item: restProduct });
      index = i;
    }

    return [index, [_product, rest], errors];
  };

export const parseProduct =
  (parens = 0): TokenParser<Product> =>
  (str, index = 0) => {
    const errors: ParsingError[] = [];
    const rest: Product[1] = [];
    const [i, prefix, _err] = parseValue(parens)(str, index);
    errors.push(..._err);
    index = i;

    while (str[index]) {
      const start = index;
      const token = str[index];
      if (token.src !== "*" && token.src !== "/") break;

      index++;

      if (!str[index]) {
        errors.push(error("missing operand", position(start, index), [endOfTokensError(index)]));
        rest.push({ type: token.src as "*" | "/", item: value("name", "_") });
        break;
      }

      const [i, restPrefix, _err] = parseValue(parens)(str, index);
      errors.push(..._err);

      rest.push({ type: token.src as "*" | "/", item: restPrefix });
      index = i;
    }

    return [index, [prefix, rest], errors];
  };

// export const parsePrefix: TokenParser<Prefix> = (str, index = 0) => {
//   const token = str[index];
//   let rest: Prefix[1];
//   if (token.type === "identifier" && token.src in PREFIX_OPS) {
//     rest = { type: PREFIX_OPS[token.src as PrefixOp] };
//     index++;
//   }
//   const [i, value, errors] = parseValue(str, index);
//   index = i;

//   return [index, [value, rest], errors];
// };

export const parseValue =
  (parens = 0): TokenParser<Value> =>
  (str, index = 0) => {
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

    if (token.src === "(" && str[index + 1]?.src === ")") {
      errors.push(error(`empty parenthesis`, intervalPosition(index, 2)));
      return [index + 2, value("name", "_"), errors];
    }

    if (token.src === "(") {
      const start = index;
      index++;

      let errors: ParsingError[] = [];
      if (!str[index]) {
        errors.push(error("unbalanced parens", position(start, index), [endOfTokensError(index)]));
        return [index, value("name", "_"), errors];
      }

      const [i, expr, _err] = parseExpr(parens + 1)(str, index);
      index = i;

      const token = str[index];

      if (!token) {
        errors.push(error("unbalanced parens", position(start, index), _err));
      } else if (token.src !== ")") {
        while (str[index] && str[index].src !== ")") index++;

        if (!str[index]) {
          _err.push(endOfTokensError(index));
          errors.push(error("unbalanced parens", position(start, index), _err));
        } else errors.push(error("no closing parens", position(start, index), _err));
      } else {
        errors = _err;
        index++;
      }

      if (parens === 0 && str[index] && str[index].src === ")") {
        errors.push(error("unbalanced parens", intervalPosition(index, 1)));
        while (str[index] && str[index].src === ")") index++;
      }

      return [index, value("expr", expr), errors];
    }

    if (token.type === "symbol") {
      errors.push(error(`symbol can't be used in place of value`, intervalPosition(index, 1)));
      return [index, value("name", "_"), errors];
    }
    return [index + 1, value("name", token.src), errors];

    // const [i, expr, _err] = parseAccessExpression(str, index);
    // return [i, value("name", expr), _err];
  };
