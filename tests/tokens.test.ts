import { parseToken, parseTokens } from "../src/tokens.js";
import { describe, expect } from "vitest";
import { it, fc, test } from "@fast-check/vitest";
import type { Token } from "../src/types";

// Test case: Parsing a string token
test.prop([fc.string().filter((s) => !s.includes("\\") && !s.includes('"'))])(
  "parseToken - string token",
  (value) => {
    const src = `"${value}"`;
    const startIndex = 0;
    const expectedToken = { type: "string", src, value };
    const expectedIndex = value.length + 2;
    const expectedErrors = [];

    const [index, token, errors] = parseToken(src, startIndex);

    expect(index).toBe(expectedIndex);
    expect(token).toEqual(expectedToken);
    expect(errors).toEqual(expectedErrors);
  }
);

test.prop([fc.string({ maxLength: 1, minLength: 1 })])(
  "parseToken - string token escape",
  (value) => {
    const src = `"\\${value}"`;
    const startIndex = 0;
    const expectedToken = { type: "string", src, value };
    const expectedIndex = 4;
    const expectedErrors = [];

    const [index, token, errors] = parseToken(src, startIndex);

    expect(index).toBe(expectedIndex);
    expect(token).toEqual(expectedToken);
    expect(errors).toEqual(expectedErrors);
  }
);

// Test case: Parsing a number token
describe("parseToken - number token", () => {
  it.prop([fc.stringMatching(/^\d+\.\d+$/)])("float literals", (src) => {
    const startIndex = 0;
    const expectedToken = { type: "number", src, value: Number(src) };
    const expectedIndex = src.length;
    const expectedErrors = [];

    const [index, token, errors] = parseToken(src, startIndex);

    expect(token).toEqual(expectedToken);
    expect(errors).toEqual(expectedErrors);
    expect(index).toBe(expectedIndex);
  });

  it.prop([fc.stringMatching(/^\d+$/)])("int literals", (src) => {
    const startIndex = 0;
    const expectedToken = { type: "number", src, value: Number(src) };
    const expectedIndex = src.length;
    const expectedErrors = [];

    const [index, token, errors] = parseToken(src, startIndex);

    expect(token).toEqual(expectedToken);
    expect(errors).toEqual(expectedErrors);
    expect(index).toBe(expectedIndex);
  });

  it.prop([fc.stringMatching(/^\d+\.$/)])("trailing dot literals", (src) => {
    const startIndex = 0;
    const expectedToken = { type: "number", src, value: Number(src + "0") };
    const expectedIndex = src.length;
    const expectedErrors = [];

    const [index, token, errors] = parseToken(src, startIndex);

    expect(token).toEqual(expectedToken);
    expect(errors).toEqual(expectedErrors);
    expect(index).toBe(expectedIndex);
  });

  it.prop([fc.stringMatching(/^\.\d+$/)])("prefix dot literals", (src) => {
    const startIndex = 0;
    const expectedToken = { type: "number", src, value: Number("0" + src) };
    const expectedIndex = src.length;
    const expectedErrors = [];

    const [index, token, errors] = parseToken(src, startIndex);

    expect(token).toEqual(expectedToken);
    expect(errors).toEqual(expectedErrors);
    expect(index).toBe(expectedIndex);
  });

  it.prop([fc.stringMatching(/^(\d+_*)*\d+\.(\d+_*)*\d+$/)])(
    "literals with spacers",
    (src) => {
      const startIndex = 0;
      const expectedToken = {
        type: "number",
        src,
        value: Number(src.replace(/_/g, "")),
      };
      const expectedIndex = src.length;
      const expectedErrors = [];

      const [index, token, errors] = parseToken(src, startIndex);

      expect(token).toEqual(expectedToken);
      expect(errors).toEqual(expectedErrors);
      expect(index).toBe(expectedIndex);
    }
  );
});

// Test case: Parsing an identifier token
test("parseToken - identifier token", () => {
  const src = "variable123";
  const startIndex = 0;
  const expectedToken = {
    type: "identifier",
    src: "variable123",
  };
  const expectedIndex = src.length;
  const expectedErrors = [];

  const [index, token, errors] = parseToken(src, startIndex);

  expect(index).toBe(expectedIndex);
  expect(token).toEqual(expectedToken);
  expect(errors).toEqual(expectedErrors);
});

// Test case: Parsing tokens from a source string
test("parseTokens", () => {
  const src = '42 "Hello" variable ((expr))';
  const startIndex = 0;
  const expectedTokens: Token[] = [
    { type: "number", src: "42", value: 42 },
    { type: "string", src: '"Hello"', value: "Hello" },
    { type: "identifier", src: "variable" },
    { type: "symbol", src: "(" },
    { type: "symbol", src: "(" },
    { type: "identifier", src: "expr" },
    { type: "symbol", src: ")" },
    { type: "symbol", src: ")" },
  ];
  const expectedErrors = [];

  const [tokens, errors] = parseTokens(src, startIndex);

  expect(tokens).toEqual(expectedTokens);
  expect(errors).toEqual(expectedErrors);
});
