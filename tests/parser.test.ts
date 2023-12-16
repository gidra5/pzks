import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";

/* 
  Перевіряє, що вираз відповідає наступним вимогам:
  •	помилки на початку арифметичного виразу ( наприклад, вираз не може починатись із закритої дужки, алгебраїчних операцій * та /);
  •	помилки, пов’язані з неправильним написанням імен змінних,  констант та при необхідності функцій;
  •	помилки у кінці виразу (наприклад, вираз не може закінчуватись будь-якою алгебраїчною операцією);
  •	помилки в середині виразу (подвійні операції, відсутність операцій перед або між дужками, операції* або / після відкритої дужки тощо);
  •	помилки, пов’язані з використанням дужок ( нерівна кількість відкритих та закритих дужок, неправильний порядок дужок, пусті дужки).
*/

describe("parsing", () => {
  const testCase = (src, expectedErrors) =>
    it(`finds all errors in example '${src}'`, () => {
      const [, , errors] = parseExpr(src);
      expect(errors).toEqual(expectedErrors);
    });

  testCase("()", [
    {
      message: "Empty parentheses",
      start: 0,
      end: 2,
    },
  ]);

  testCase(")", [
    {
      message: "Mismatched parentheses",
      start: 0,
      end: 1,
    },
  ]);

  testCase("1 + * 2", [
    {
      message: "Unexpected operator",
      start: 4,
      end: 5,
    },
  ]);

  testCase("1 + (2 + 3", [
    {
      message: "Mismatched parentheses",
      start: 0,
      end: 1,
    },
  ]);

  testCase("1 + (2 + 3))", [
    {
      message: "Mismatched parentheses",
      start: 10,
      end: 11,
    },
  ]);

  testCase("1 + (2 + 3)) +", [
    {
      message: "Expected an expression",
      start: 14,
      end: 15,
    },
  ]);

  testCase("1 + (2 + 3) *", [
    {
      message: "Expected an expression",
      start: 12,
      end: 13,
    },
  ]);

  testCase("1 + 2 +", [
    {
      message: "Expected an expression",
      start: 6,
      end: 7,
    },
  ]);

  testCase("1 +", [
    {
      message: "expected an expression",
      cause: [{ message: "end of text", start: 3, end: 3 }],
      start: 2,
      end: 3,
    },
  ]);

  testCase("1 -", [
    {
      message: "expected an expression",
      cause: [{ message: "end of text", start: 3, end: 3 }],
      start: 2,
      end: 3,
    },
  ]);

  testCase("1 *", [
    {
      message: "expected an expression",
      cause: [{ message: "end of text", start: 3, end: 3 }],
      start: 2,
      end: 3,
    },
  ]);

  testCase("1 /", [
    {
      message: "expected an expression",
      cause: [{ message: "end of text", start: 3, end: 3 }],
      start: 2,
      end: 3,
    },
  ]);

  testCase("(", [
    {
      message: "expected an expression",
      cause: [{ message: "end of text", start: 1, end: 1 }],
      start: 0,
      end: 1,
    },
  ]);

  testCase(")", [
    {
      message: "expected an expression",
      cause: [{ message: "expected a value", start: 1, end: 1 }],
      start: 0,
      end: 1,
    },
  ]);

  testCase("+ 1", [
    {
      message: "expected an expression",
      cause: [{ message: "expected a value" }],
      start: 0,
      end: 1,
    },
  ]);
});
