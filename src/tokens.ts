import { error, intervalPosition, position } from "./constructor.js";
import type { ParsingError, StringParser, TokenPos } from "./types";
import { endOfTokensError } from "./utils.js";

export const parseToken: StringParser<TokenPos> = (src, i = 0) => {
  let index = i;
  const errors: ParsingError[] = [];

  while (/\s/.test(src.charAt(index))) index++;

  if (src.charAt(index) === '"') {
    const start = index;
    index++;

    let value = "";
    while (src.charAt(index) !== '"') {
      if (src.charAt(index) === "\\") index++;

      if (!src.charAt(index)) {
        const pos = intervalPosition(start, index);
        const errors = [endOfTokensError(index)];
        errors.push(error(`unterminated string`, pos, errors));
        break;
      }

      value += src.charAt(index);
      index++;
    }
    index++;

    return [
      index,
      {
        type: "string",
        src: src.substring(start, index),
        value,
        pos: position(start, index),
      },
      errors,
    ];
  }

  if (/\d/.test(src.charAt(index))) {
    const start = index;

    let value = "";
    while (/[_\d]/.test(src.charAt(index))) {
      while (src.charAt(index) === "_") {
        index++;
      }
      value += src.charAt(index);
      index++;
    }
    if (src.charAt(index) === ".") value += src.charAt(index++);
    if (/\d/.test(src.charAt(index))) {
      value += src.charAt(index);
      index++;
      while (/[_\d]/.test(src.charAt(index))) {
        while (src.charAt(index) === "_") {
          index++;
        }
        value += src.charAt(index);
        index++;
      }
    }

    return [
      index,
      {
        type: "number",
        src: src.substring(start, index),
        value: Number(value),
        pos: position(start, index),
      },
      errors,
    ];
  }

  if (/[_\w]/.test(src.charAt(index))) {
    const start = index;
    while (/[_\w\d]/.test(src.charAt(index))) index++;

    return [
      index,
      {
        type: "identifier",
        src: src.substring(start, index),
        pos: position(start, index),
      },
      errors,
    ];
  }

  if (src.charAt(index) === "." && /\d/.test(src.charAt(index + 1))) {
    const start = index;
    index++;
    let value = "0.";
    while (/[_\d]/.test(src.charAt(index))) {
      while (src.charAt(index) === "_") {
        index++;
      }
      value += src.charAt(index);
      index++;
    }

    return [
      index,
      {
        type: "number",
        src: src.substring(start, index),
        value: Number(value),
        pos: position(start, index),
      },
      errors,
    ];
  }

  const start = index;
  while (/[^_\w\s\d."\(\)\[\]\{\}\<\>;,\-]/.test(src.charAt(index))) index++;
  if (start === index) index++;

  return [
    index,
    {
      type: "symbol",
      src: src.substring(start, index),
      pos: position(start, index),
    },
    errors,
  ];
};

export const parseTokens: StringParser<TokenPos[], true> = (src, i = 0) => {
  let index = i;
  const errors: ParsingError[] = [];
  const tokens: TokenPos[] = [];

  while (src.charAt(index)) {
    const [nextIndex, token, _errors] = parseToken(src, index);

    index = nextIndex;
    tokens.push(token);
    errors.push(..._errors);
  }

  return [tokens, errors];
};
