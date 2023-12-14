import { ParsingError, StringParser, Token } from "./types";

export const parseToken: StringParser<Token> = (src, i = 0) => {
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
        errors.push({
          message: "unterminated string",
          cause: [{ message: "end of text" }],
        });
        break;
      }

      value += src.charAt(index);
      index++;
    }
    index++;

    return [
      index,
      { type: "string", src: src.substring(start, index), value },
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
      },
      errors,
    ];
  }

  if (/[_\w]/.test(src.charAt(index))) {
    const start = index;
    while (/[_\w\d]/.test(src.charAt(index))) index++;

    return [
      index,
      { type: "identifier", src: src.substring(start, index) },
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
      },
      errors,
    ];
  }

  const start = index;
  index++;
  while (/[^_\w\s\d."\(\)\[\]\{\}\<\>;]/.test(src.charAt(index))) index++;

  return [index, { type: "symbol", src: src.substring(start, index) }, errors];
};

export const parseTokens: StringParser<Token[], true> = (src, i = 0) => {
  let index = i;
  const errors: ParsingError[] = [];
  const tokens: Token[] = [];

  while (src.charAt(index)) {
    const [nextIndex, token, _errors] = parseToken(src, index);

    index = nextIndex;
    tokens.push(token);
    errors.push(..._errors);
  }

  return [tokens, errors];
};
