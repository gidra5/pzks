import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";
import { printErrors, printTree } from "../src/utils.js";
import { Sum } from "../src/types.js";
import { FileMap } from "codespan-napi";
import { treeExpression } from "../src/tree.js";

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
      const [tokens, _errors] = parseTokens(src);
      // console.log(tokens);

      const [, tree, errors] = parseExpr()(tokens);
      // console.dir({ tree, errors }, { depth: null });
      // console.log(printTree(treeExpression(tree)));
      // let map = new FileMap();
      // const fileName = "test";
      // map.addFile(fileName, src);
      // printErrors(errors, tokens, map, fileName);

      expect(errors).toEqual(expectedErrors);
    });

  testCase("()", [
    {
      message: "empty parenthesis",
      cause: [],
      pos: { start: 0, end: 2 },
    },
  ]);

  testCase(")", [
    {
      message: "unexpected closing parenthesis, expected value",
      cause: [],
      pos: { start: 0, end: 1 },
    },
  ]);

  testCase("(", [
    {
      message: "unbalanced parens",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 1, end: 1 },
        },
      ],
      pos: { start: 0, end: 1 },
    },
  ]);

  testCase("* 1", [
    {
      message: "symbol can't be used in place of value",
      cause: [],
      pos: { start: 0, end: 1 },
    },
  ]);

  testCase("1 + 2^3 * 4", []);

  testCase("1 + * 2", [
    {
      message: "symbol can't be used in place of value",
      cause: [],
      pos: { start: 2, end: 3 },
    },
  ]);

  testCase("1 + (2 + 3", [
    {
      message: "unbalanced parens",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 6, end: 6 },
        },
      ],
      pos: { start: 2, end: 6 },
    },
  ]);

  testCase("1 + (2 + 3))", [
    {
      message: "unbalanced parens",
      cause: [],
      pos: { start: 7, end: 8 },
    },
  ]);

  testCase("1 + (2 + 3) +", [
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 8, end: 8 },
        },
      ],
      pos: { start: 7, end: 8 },
    },
  ]);

  testCase("1 + (2 + 3)) +", [
    {
      message: "unbalanced parens",
      cause: [],
      pos: { start: 7, end: 8 },
    },
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: [],
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
          cause: [],
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
          cause: [],
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
          cause: [],
          pos: { start: 2, end: 2 },
        },
      ],
      pos: { start: 1, end: 2 },
    },
  ]);

  testCase(" q + )/", [
    {
      message: "unexpected closing parenthesis, expected value",
      cause: [],
      pos: { start: 2, end: 3 },
    },
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 4, end: 4 },
        },
      ],
      pos: { start: 3, end: 4 },
    },
  ]);

  testCase(" - )/q + )/", [
    {
      message: "unexpected closing parenthesis, expected value",
      cause: [],
      pos: { start: 1, end: 2 },
    },
    {
      message: "unexpected closing parenthesis, expected value",
      cause: [],
      pos: { start: 5, end: 6 },
    },
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 7, end: 7 },
        },
      ],
      pos: { start: 6, end: 7 },
    },
  ]);

  testCase("1 * (5/3) (*4", [
    {
      message: "missing operator",
      cause: [],
      pos: { start: 7, end: 7 },
    },
    {
      message: "unbalanced parens",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 10, end: 10 },
        },
      ],
      pos: { start: 7, end: 10 },
    },
    {
      message: "symbol can't be used in place of value",
      cause: [],
      pos: { start: 8, end: 9 },
    },
  ]);

  testCase("1 * (* 2)", [
    {
      message: "symbol can't be used in place of value",
      cause: [],
      pos: { start: 3, end: 4 },
    },
  ]);

  testCase("1 * (2) (3)", [
    {
      message: "missing operator",
      cause: [],
      pos: { start: 5, end: 5 },
    },
  ]);

  testCase("1 (2)", [
    {
      message: "missing operator",
      cause: [],
      pos: { start: 1, end: 1 },
    },
  ]);

  testCase("send((1+2), 3)", []);
  testCase("send((1+2), 3+,4)", [
    {
      message: "unexpected token inside fn args",
      cause: [
        {
          message: "symbol can't be used in place of value",
          cause: [],
          pos: { start: 10, end: 11 },
        },
      ],
      pos: { start: 8, end: 10 },
    },
  ]);
  testCase("send([j, i])", [
    {
      message: "unexpected token inside fn args",
      cause: [
        {
          message: "symbol can't be used in place of value",
          cause: [],
          pos: { start: 2, end: 3 },
        },
      ],
      pos: { start: 2, end: 2 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 2, end: 3 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 6, end: 7 },
    },
  ]);
  testCase("send(2, 3)", []);
  testCase("--i", []);
  testCase("send(-(2x+7)/A[j, i], 127.0.0.1)", [
    {
      message: "unexpected token inside fn args",
      cause: [
        {
          message: "unexpected token inside parens",
          cause: [
            {
              message: 'unexpected token: "x"',
              cause: [],
              pos: { start: 5, end: 6 },
            },
          ],
          pos: { start: 3, end: 9 },
        },
      ],
      pos: { start: 2, end: 11 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 11, end: 12 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 15, end: 16 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 18, end: 19 },
    },
  ]);
  testCase("send(-(2x+7)/A[j, i], 127.0.0.1 ) + )/", [
    {
      message: "unexpected token inside fn args",
      cause: [
        {
          message: "unexpected token inside parens",
          cause: [
            {
              message: 'unexpected token: "x"',
              cause: [],
              pos: { start: 5, end: 6 },
            },
          ],
          pos: { start: 3, end: 9 },
        },
      ],
      pos: { start: 2, end: 11 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 11, end: 12 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 15, end: 16 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 18, end: 19 },
    },
    {
      message: "unexpected closing parenthesis, expected value",
      cause: [],
      pos: { start: 22, end: 23 },
    },
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 24, end: 24 },
        },
      ],
      pos: { start: 23, end: 24 },
    },
  ]);
  testCase("1 - 1)*1", [
    {
      message: "unexpected closing parenthesis after value",
      cause: [],
      pos: { start: 3, end: 4 },
    },
  ]);
  testCase("1 - 1)*1+", [
    {
      message: "unexpected closing parenthesis after value",
      cause: [],
      pos: { start: 3, end: 4 },
    },
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 7, end: 7 },
        },
      ],
      pos: { start: 6, end: 7 },
    },
  ]);

  testCase("(2x^2-5x+7)-(-i)+ (j++)/0 - )(*f)(2, 7-x, )/q + send(-(2x+7)/A[j, i], 127.0.0.1 ) + )/", [
    {
      message: "unexpected token inside parens",
      cause: [
        {
          message: 'unexpected token: "x"',
          cause: [],
          pos: { start: 2, end: 3 },
        },
      ],
      pos: { start: 0, end: 11 },
    },
    {
      message: "unexpected token inside parens",
      cause: [
        {
          message: 'unexpected token: "++"',
          cause: [],
          pos: { start: 19, end: 20 },
        },
      ],
      pos: { start: 17, end: 21 },
    },
    {
      message: "unexpected closing parenthesis, expected value",
      cause: [],
      pos: { start: 24, end: 25 },
    },
    {
      message: "missing operator",
      cause: [],
      pos: { start: 25, end: 25 },
    },
    {
      message: "symbol can't be used in place of value",
      cause: [],
      pos: { start: 26, end: 27 },
    },
    {
      message: "missing operator",
      cause: [],
      pos: { start: 29, end: 29 },
    },
    {
      message: "unexpected token inside parens",
      cause: [
        {
          message: 'unexpected token: ","',
          cause: [],
          pos: { start: 31, end: 32 },
        },
      ],
      pos: { start: 29, end: 37 },
    },
    {
      message: "unexpected token inside fn args",
      cause: [
        {
          message: "unexpected token inside parens",
          cause: [
            {
              message: 'unexpected token: "x"',
              cause: [],
              pos: { start: 45, end: 46 },
            },
          ],
          pos: { start: 43, end: 49 },
        },
      ],
      pos: { start: 42, end: 51 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 51, end: 52 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 55, end: 56 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 58, end: 59 },
    },
    {
      message: "unexpected closing parenthesis, expected value",
      cause: [],
      pos: { start: 62, end: 63 },
    },
    {
      message: "missing operand",
      cause: [
        {
          message: "end of tokens",
          cause: [],
          pos: { start: 64, end: 64 },
        },
      ],
      pos: { start: 63, end: 64 },
    },
  ]);

  testCase("(2^2-5x+7)-(-i)+ (j)/0 - 1)*(1*f)+(27-x, )/q + send(-(2+7)/A,[j, i, 127.0.1 ) + 1)/1", [
    {
      message: "unexpected token inside parens",
      cause: [
        {
          message: 'unexpected token: "x"',
          cause: [],
          pos: { start: 6, end: 7 },
        },
      ],
      pos: { start: 0, end: 10 },
    },
    {
      message: "unexpected closing parenthesis after value",
      cause: [],
      pos: { start: 23, end: 24 },
    },
    {
      message: "unexpected token inside parens",
      cause: [
        {
          message: 'unexpected token: ","',
          cause: [],
          pos: { start: 35, end: 36 },
        },
      ],
      pos: { start: 31, end: 37 },
    },
    {
      message: "unexpected token inside fn args",
      cause: [
        {
          message: "symbol can't be used in place of value",
          cause: [],
          pos: { start: 51, end: 52 },
        },
      ],
      pos: { start: 51, end: 51 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 51, end: 52 },
    },
    {
      message: "expected comma or closing parens",
      cause: [],
      pos: { start: 57, end: 58 },
    },
    {
      message: "unexpected closing parenthesis after value",
      cause: [],
      pos: { start: 61, end: 62 },
    },
  ]);

  testCase("(2^2-5+7)-(-i)+ (j)/0 - 1*(1*f)+(27-x )/q + send(-(2+7)/A,j, i, 127.0 ) + 1/1", []);

  testCase("-(a+b)", []);

  testCase("(,) + .. + a", [
    {
      message: "unexpected token inside parens",
      cause: [
        {
          message: "symbol can't be used in place of value",
          cause: [],
          pos: { start: 1, end: 2 },
        },
        {
          message: 'unexpected token: ","',
          cause: [],
          pos: { start: 1, end: 2 },
        },
      ],
      pos: { start: 0, end: 3 },
    },
    {
      message: "symbol can't be used in place of value",
      cause: [],
      pos: { start: 4, end: 5 },
    },
  ]);

  testCase("(,) + a", [
    {
      message: "unexpected token inside parens",
      cause: [
        {
          message: "symbol can't be used in place of value",
          cause: [],
          pos: { start: 1, end: 2 },
        },
        {
          message: 'unexpected token: ","',
          cause: [],
          pos: { start: 1, end: 2 },
        },
      ],
      pos: { start: 0, end: 3 },
    },
  ]);
});
