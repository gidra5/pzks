import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";

/* 
  Перевіряє, що вираз відповідає наступним вимогам:
  •	помилки на початку арифметичного виразу ( наприклад, вираз не може починатись із закритої дужки, алгебраїчних операцій * та /);
•	помилки, пов’язані з неправильним написанням імен змінних,  констант та при необхідності функцій;
  •	помилки у кінці виразу (наприклад, вираз не може закінчуватись будь-якою алгебраїчною операцією);
  •	помилки в середині виразу (подвійні операції, відсутність операцій перед або між дужками, операції* або / після відкритої дужки тощо);
  •	помилки, пов’язані з використанням дужок ( нерівна кількість відкритих та закритих дужок, неправильний порядок дужок, пусті дужки).
*/

describe("parsing", () => {
  const testCase = (src, expectedErrors, _it: any = it) =>
    _it(`finds all errors in example '${src}'`, () => {
      const [, tree, errors] = parseExpr()(parseTokens(src)[0]);
      console.dir({ tree, errors }, { depth: null });

      expect(errors).toEqual(expectedErrors);
    });

  testCase("()", [
    {
      message: "empty parenthesis",
      pos: { start: 0, end: 2 },
    },
  ]);

  testCase(")", [
    {
      message: "symbol can't be used in place of value",
      pos: { start: 0, end: 1 },
    },
  ]);

  testCase("(", [
    {
      message: "unbalanced parens",
      cause: [{ message: "end of tokens", pos: { start: 1, end: 1 } }],
      pos: { start: 0, end: 1 },
    },
  ]);

  testCase("* 1", [
    {
      message: "symbol can't be used in place of value",
      pos: { start: 0, end: 1 },
    },
  ]);

  testCase("1 + * 2", [
    {
      message: "symbol can't be used in place of value",
      cause: undefined,
      pos: { start: 2, end: 3 },
    },
  ]);

  testCase("1 + (2 + 3", [
    {
      message: "unbalanced parens",
      cause: [],
      pos: { start: 2, end: 6 },
    },
  ]);

  testCase("1 + (2 + 3))", [
    {
      message: "unbalanced parens",
      cause: undefined,
      pos: { start: 7, end: 8 },
    },
  ]);

  testCase("1 + (2 + 3) +", [
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: undefined,
          pos: { start: 8, end: 8 },
        },
      ],
      pos: { start: 7, end: 8 },
    },
  ]);

  testCase("1 + (2 + 3)) +", [
    {
      message: "unbalanced parens",
      cause: undefined,
      pos: { start: 7, end: 8 },
    },
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: undefined,
          pos: { start: 9, end: 9 },
        },
      ],
      pos: { start: 8, end: 9 },
    },
  ]);

  testCase("1 + 2 +", [
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: undefined,
          pos: { start: 4, end: 4 },
        },
      ],
      pos: { start: 3, end: 4 },
    },
  ]);

  testCase("1 +", [
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: undefined,
          pos: { start: 2, end: 2 },
        },
      ],
      pos: { start: 1, end: 2 },
    },
  ]);

  testCase("1 *", [
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: undefined,
          pos: { start: 2, end: 2 },
        },
      ],
      pos: { start: 1, end: 2 },
    },
  ]);

  testCase(
    "1 * (5/3) (*4",
    [
      {
        message: "missing operand",
        cause: [
          {
            message: "end of tokens",
            cause: undefined,
            pos: { start: 2, end: 2 },
          },
        ],
        pos: { start: 1, end: 2 },
      },
    ],
    it.only
  );

  testCase("1 * (* 2)", [
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: undefined,
          pos: { start: 2, end: 2 },
        },
      ],
      pos: { start: 1, end: 2 },
    },
  ]);

  testCase("1 * (2) (3)", [
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: undefined,
          pos: { start: 2, end: 2 },
        },
      ],
      pos: { start: 1, end: 2 },
    },
  ]);

  testCase("1 (2)", [
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: undefined,
          pos: { start: 2, end: 2 },
        },
      ],
      pos: { start: 1, end: 2 },
    },
  ]);
});
