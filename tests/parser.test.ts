import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";
import { treeExpression } from "../src/print.js";
import { printTree } from "../src/utils.js";
import {
  Diagnostic,
  FileMap,
  primaryDiagnosticLabel,
  secondaryDiagnosticLabel,
} from "codespan-napi";
import { TokenPos } from "../src/types.js";

/* 
  Перевіряє, що вираз відповідає наступним вимогам:
  •	помилки на початку арифметичного виразу ( наприклад, вираз не може починатись із закритої дужки, алгебраїчних операцій * та /);
  •	помилки, пов’язані з неправильним написанням імен змінних,  констант та при необхідності функцій;
  •	помилки у кінці виразу (наприклад, вираз не може закінчуватись будь-якою алгебраїчною операцією);
  •	помилки в середині виразу (подвійні операції, відсутність операцій перед або між дужками, операції* або / після відкритої дужки тощо);
  •	помилки, пов’язані з використанням дужок ( нерівна кількість відкритих та закритих дужок, неправильний порядок дужок, пусті дужки).
*/

const tokenPosToSrcPos = (tokenPos, tokens: TokenPos[]) => ({
  start: tokens[tokenPos.start].pos.start,
  end: tokens[tokenPos.end - 1].pos.end,
});

describe("parsing", () => {
  const testCase = (src, expectedErrors, _it: any = it) =>
    _it(`finds all errors in example '${src}'`, () => {
      const [tokens, _errors] = parseTokens(src);
      // console.log(tokens);

      const [, tree, errors] = parseExpr()(tokens);
      // console.dir({ tree, errors }, { depth: null });
      printTree(treeExpression(tree));
      let map = new FileMap();
      // const fileName = "test";
      // map.addFile(fileName, src);
      // const errorDiagnosticLabel = (error) => {
      //   const label = secondaryDiagnosticLabel(map.getFileId(fileName), {
      //     ...tokenPosToSrcPos(error.pos, tokens),
      //     message: error.message,
      //   });
      //   return label;
      // };
      // const errorDiagnostic = (error) => {
      //   const diagnostic = Diagnostic.error();
      //   const fileId = map.getFileId(fileName);
      //   diagnostic.withLabels([
      //     primaryDiagnosticLabel(fileId, {
      //       ...tokenPosToSrcPos(error.pos, tokens),
      //       message: error.message,
      //     }),
      //     ...error.cause.map(errorDiagnosticLabel),
      //   ]);
      //   return diagnostic;
      // };
      // const errorsDiagnostic = errors.map(errorDiagnostic);

      // errorsDiagnostic.forEach((error) => error.emitStd(map));

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
      message: "symbol can't be used in place of value",
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

  testCase(
    "(2x^2-5x+7)-(-i)+ (j++)/0 - )(*f)(2, 7-x, )/q + send(-(2x+7)/A[j, i], 127.0.0.1 ) + )/",
    [
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
        message: "symbol can't be used in place of value",
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
        message: "missing operator",
        cause: [],
        pos: { start: 41, end: 41 },
      },
      {
        message: "unexpected token inside parens",
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
          {
            message: 'unexpected token: "["',
            cause: [],
            pos: { start: 51, end: 52 },
          },
        ],
        pos: { start: 41, end: 61 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 62, end: 63 },
      },
    ]
  );

  testCase(
    "(2^2-5+7)-(-i)+ (j++)/0 - )(*f)(2, 7-x, )/q + send(-(2+7)/A[j, i], 127.0.0.1 ) + )/",
    [
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: "++"',
            cause: [],
            pos: { start: 17, end: 18 },
          },
        ],
        pos: { start: 15, end: 19 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 22, end: 23 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 23, end: 23 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 24, end: 25 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 27, end: 27 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: ","',
            cause: [],
            pos: { start: 29, end: 30 },
          },
        ],
        pos: { start: 27, end: 35 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 39, end: 39 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: "["',
            cause: [],
            pos: { start: 48, end: 49 },
          },
        ],
        pos: { start: 39, end: 58 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 59, end: 60 },
      },
    ]
  );

  testCase(
    "(2^2-5+7)-(-i)+ (j)/0 - )(*f)(2, 7-x, )/q + send(-(2+7)/A[j, i], 127.0.0.1 ) + )/",
    [
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 21, end: 22 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 22, end: 22 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 23, end: 24 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 26, end: 26 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: ","',
            cause: [],
            pos: { start: 28, end: 29 },
          },
        ],
        pos: { start: 26, end: 34 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 38, end: 38 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: "["',
            cause: [],
            pos: { start: 47, end: 48 },
          },
        ],
        pos: { start: 38, end: 57 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 58, end: 59 },
      },
    ]
  );

  testCase(
    "(2^2-5+7)-(-i)+ (j)/0 - 1)+(1*f)*(2+ 7-x, )/q + send*(-(2+7)/A(j, i), 127.0.0.1 ) + 2)/",
    [
      {
        message: "missing operator",
        cause: [],
        pos: { start: 22, end: 22 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 22, end: 23 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: ","',
            cause: [],
            pos: { start: 36, end: 37 },
          },
        ],
        pos: { start: 30, end: 38 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: "("',
            cause: [],
            pos: { start: 52, end: 53 },
          },
        ],
        pos: { start: 43, end: 57 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 57, end: 57 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 57, end: 58 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 58, end: 58 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 59, end: 59 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 60, end: 60 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 61, end: 61 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 61, end: 62 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 64, end: 64 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 64, end: 65 },
      },
    ]
  );

  testCase(
    "(2^2-5+7)-(-i)+ (j)/0 - 1)+(1*f)*(2+ 7-x )/q + send*(-(2+7)/A*(j, i), 127.0.0.1 ) + 2)/",
    [
      {
        message: "missing operator",
        cause: [],
        pos: { start: 22, end: 22 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 22, end: 23 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: ","',
            cause: [],
            pos: { start: 36, end: 37 },
          },
        ],
        pos: { start: 30, end: 38 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: "("',
            cause: [],
            pos: { start: 52, end: 53 },
          },
        ],
        pos: { start: 43, end: 57 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 57, end: 57 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 57, end: 58 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 58, end: 58 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 59, end: 59 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 60, end: 60 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 61, end: 61 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 61, end: 62 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 64, end: 64 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 64, end: 65 },
      },
    ]
  );

  testCase(
    "(2^2-5+7)-(-i)+ (j)/0 - 1)+(1*f)*(2+ 7-x )/q + send*(-(2+7)/A*(j+ i)+ 127.0.0.1 ) + 2)/",
    [
      {
        message: "missing operator",
        cause: [],
        pos: { start: 22, end: 22 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 22, end: 23 },
      },
      {
        message: "unexpected token inside parens",
        cause: [
          {
            message: 'unexpected token: ".0"',
            cause: [],
            pos: { start: 59, end: 60 },
          },
        ],
        pos: { start: 42, end: 62 },
      },
      {
        message: "missing operator",
        cause: [],
        pos: { start: 64, end: 64 },
      },
      {
        message: "symbol can't be used in place of value",
        cause: [],
        pos: { start: 64, end: 65 },
      },
    ]
  );

  testCase(
    "(2^2-5+7)-(-i)+ (j)/0 - 1)+(1*f)*(2+ 7-x )/q + send*(-(2+7)/A*(j+ i)+ 127.0+.0+.1 ) + 2)/",
    [],
    it.only
  );

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
    {
      message: "missing operator",
      cause: [],
      pos: { start: 5, end: 5 },
    },
    {
      message: "symbol can't be used in place of value",
      cause: [],
      pos: { start: 5, end: 6 },
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

  testCase("f(a,b )", [
    {
      message: "missing operator",
      cause: [],
      pos: { start: 1, end: 1 },
    },
    {
      message: "unexpected token inside parens",
      cause: [
        {
          message: 'unexpected token: ","',
          cause: [],
          pos: { start: 3, end: 4 },
        },
      ],
      pos: { start: 1, end: 6 },
    },
  ]);
});
