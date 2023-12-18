import {
  position,
  error,
  value,
  intervalPosition,
  product,
  token,
  prefix,
  pow,
} from "./constructor";
import {
  AccessExpression,
  Expression,
  Sum,
  Product,
  Value,
  TokenParser,
  ParsingError,
  PREFIX_OPS,
  PrefixOp,
  Prefix,
  Pow,
} from "./types";
import { endOfTokensError } from "./utils";

export const parseAccessExpression: TokenParser<AccessExpression> = (
  str,
  index = 0
) => {
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
      errors.push(
        error(
          "can't be part of access expression",
          intervalPosition(index - 1, 1)
        )
      );
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
      let _token = str[index];
      const isSumOp = _token.src === "+" || _token.src === "-";
      if (_token.type !== "symbol" || !isSumOp) {
        if (parens === 0 && index < str.length - 1) {
          errors.push(error("missing operator", position(start, index)));
          _token = token("symbol", "_");
        } else {
          break;
        }
      } else {
        index++;
      }

      if (!str[index]) {
        errors.push(
          error("missing operand", position(start, index), [
            endOfTokensError(index),
          ])
        );
        rest.push({
          type: _token.src as "+" | "-",
          item: product(pow(prefix(value("name", "_")))),
        });
        break;
      }

      const [i, restProduct, _err] = parseProduct(parens)(str, index);
      errors.push(..._err);

      rest.push({ type: _token.src as "+" | "-", item: restProduct });
      if (i !== index) index = i;
      else index++;
    }

    return [index, [_product, rest], errors];
  };

export const parseProduct =
  (parens = 0): TokenParser<Product> =>
  (str, index = 0) => {
    const errors: ParsingError[] = [];
    const rest: Product[1] = [];
    const [i, _prefix, _err] = parsePow(parens)(str, index);
    errors.push(..._err);
    index = i;

    while (str[index]) {
      const start = index;
      const token = str[index];
      if (token.src !== "*" && token.src !== "/") break;

      index++;

      if (!str[index]) {
        errors.push(
          error("missing operand", position(start, index), [
            endOfTokensError(index),
          ])
        );
        rest.push({
          type: token.src as "*" | "/",
          item: pow(prefix(value("name", "_"))),
        });
        break;
      }

      const [i, restPrefix, _err] = parsePow(parens)(str, index);
      errors.push(..._err);

      rest.push({ type: token.src as "*" | "/", item: restPrefix });
      index = i;
    }

    return [index, [_prefix, rest], errors];
  };
export const parsePow =
  (parens = 0): TokenParser<Pow> =>
  (str, index = 0) => {
    const errors: ParsingError[] = [];
    const rest: Pow[1] = [];
    const [i, _prefix, _err] = parsePrefix(parens)(str, index);
    errors.push(..._err);
    index = i;

    while (str[index]) {
      const start = index;
      const token = str[index];
      if (token.src !== "^") break;

      index++;

      if (!str[index]) {
        errors.push(
          error("missing operand", position(start, index), [
            endOfTokensError(index),
          ])
        );
        rest.push({
          type: token.src as "^",
          item: prefix(value("name", "_")),
        });
        break;
      }

      const [i, restPrefix, _err] = parsePrefix(parens)(str, index);
      errors.push(..._err);

      rest.push({ type: token.src as "^", item: restPrefix });
      index = i;
    }

    return [index, [_prefix, rest], errors];
  };

export const parsePrefix =
  (parens = 0): TokenParser<Prefix> =>
  (str, index = 0) => {
    const token = str[index];
    let rest: Prefix[1];
    if (
      (token.type === "identifier" || token.type === "symbol") &&
      token.src in PREFIX_OPS
    ) {
      rest = { type: PREFIX_OPS[token.src as PrefixOp] };
      index++;
    }
    const [i, value, errors] = parseValue(parens)(str, index);
    index = i;

    return [index, [value, rest], errors];
  };

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
        errors.push(
          error("unbalanced parens", position(start, index), [
            endOfTokensError(index),
          ])
        );
        return [index, value("name", "_"), errors];
      }

      const [i, expr, _err] = parseExpr(parens + 1)(str, index);
      index = i;

      const token = str[index];

      if (!token) {
        const errs = [endOfTokensError(index)];
        errors.push(error("unbalanced parens", position(start, index), errs));
        errors.push(..._err);
      } else if (token.src !== ")") {
        _err.push(
          error(
            `unexpected token: "${str[index].src}"`,
            intervalPosition(index, 1)
          )
        );
        while (str[index] && str[index].src !== ")") index++;

        if (!str[index]) {
          _err.push(endOfTokensError(index));
          errors.push(error("unbalanced parens", position(start, index), _err));
        } else {
          index++;
          errors.push(
            error(
              "unexpected token inside parens",
              position(start, index),
              _err
            )
          );
        }
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
      errors.push(
        error(
          `symbol can't be used in place of value`,
          intervalPosition(index, 1)
        )
      );
      return [index, value("name", "_"), errors];
    }
    return [index + 1, value("name", token.src), errors];

    // const [i, expr, _err] = parseAccessExpression(str, index);
    // return [i, value("name", expr), _err];
  };
