import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";
import { treeExpression } from "../src/tree.js";
import { rebalance } from "../src/optimizer.js";
import { machineStates } from "../src/machine.js";
import { printTree } from "../src/utils.js";

const padEnd = (str: string, len: number, x: string) => {
  if (str.length >= len) return str;
  return str + x.repeat(len - str.length);
};

const printTable = (table: string[][]) => {
  const max = table.reduce((max, row) => Math.max(max, row.length), 0);
  const pad = (str: string) => padEnd(str, max, " ");
  const rows = table.map((row) => row.map(pad).join(" | "));
  return rows.join("\n");
};

describe("parsing", () => {
  const testCase = (
    src,
    expectedStates,
    costs = {},
    n = 2,
    m = 1,
    _it: any = it
  ) =>
    _it(`emulates tree in example '${src}'`, () => {
      const [tokens, _errors] = parseTokens(src);

      const [, tree] = parseExpr()(tokens);
      const exprTree = treeExpression(tree);
      const optimizedTree = rebalance(costs)(exprTree)[0];
      const states = machineStates(optimizedTree, costs, n, m);
      // console.log(printTree(optimizedTree));
      // console.log(states, states.length);
      // console.log(
      //   printTable(states.map((row, i) => [(i + 1).toString(), ...row]))
      // );

      expect(states).toEqual(expectedStates);
    });

  testCase("a+b", [
    ["read", "noop"],
    ["compute", "noop"],
    ["write", "noop"],
  ]);

  testCase("a+b+c+d", [
    ["read", "noop"],
    ["compute", "read"],
    ["write", "compute"],
    ["noop", "write"],
    ["read", "noop"],
    ["compute", "noop"],
    ["write", "noop"],
  ]);

  testCase(
    "a*b+c*d",
    [
      ["read", "noop"],
      ["compute", "read"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["write", "compute"],
      ["noop", "write"],
      ["read", "noop"],
      ["compute", "noop"],
      ["write", "noop"],
    ],
    { "+": 1, "*": 4 }
  );
  testCase(
    "a*b+c*d+e*f",
    [
      ["read", "noop"],
      ["compute", "read"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["write", "compute"],
      ["noop", "write"],
      ["read", "noop"],
      ["compute", "read"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["compute", "write"],
      ["write", "noop"],
      ["read", "noop"],
      ["compute", "noop"],
      ["compute", "noop"],
      ["write", "noop"],
    ],
    { "+": 2, "*": 4 }
  );
  testCase(
    "a*b+g/h-c*d+e*f",
    [
      ["read", "noop"],
      ["compute", "read"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["write", "compute"],
      ["noop", "write"],
      ["read", "noop"],
      ["compute", "read"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["compute", "write"],
      ["compute", "noop"],
      ["compute", "noop"],
      ["write", "noop"],
      ["read", "noop"],
      ["compute", "read"],
      ["compute", "compute"],
      ["compute", "compute"],
      ["write", "noop"],
      ["noop", "write"],
      ["read", "noop"],
      ["compute", "noop"],
      ["compute", "noop"],
      ["compute", "noop"],
      ["write", "noop"],
    ],
    { "+": 2, "*": 4, "/": 8, "-": 3 }
  );

  testCase("a-b*(k-t+(f-g)*(f*5.9-q)+(w-y*(m-1))/p)-(x-3)*(x+3)/(d+q-w)", [], {
    "+": 2,
    "*": 4,
    "/": 8,
    "-": 3,
  });
  // testCase("a-b*(k-t+(f-g)*(f*5.9-q)+(w-y*(m-1))/p)-(x-3)*(x+3)/(d+q-w)", [], {
  //   "+": 2,
  //   "*": 4,
  //   "/": 8,
  //   "-": 3,
  // });

  // testCase(
  //   "a*b+g/h-c*d+e*f",
  //   [
  //     ["read", "noop", "noop", "noop", "noop"],
  //     ["compute", "read", "noop", "noop", "noop"],
  //     ["compute", "compute", "read", "noop", "noop"],
  //     ["compute", "compute", "compute", "read", "noop"],
  //     ["compute", "compute", "compute", "compute", "noop"],
  //     ["write", "compute", "compute", "compute", "noop"],
  //     ["noop", "write", "compute", "compute", "noop"],
  //     ["noop", "noop", "compute", "compute", "read"],
  //     ["noop", "noop", "compute", "write", "noop"],
  //     ["noop", "noop", "compute", "noop", "read"],
  //     ["noop", "noop", "compute", "noop", "compute"],
  //     ["noop", "noop", "write", "noop", "compute"],
  //     ["noop", "noop", "noop", "noop", "compute"],
  //     ["noop", "noop", "noop", "noop", "write"],
  //     ["read", "noop", "noop", "noop", "noop"],
  //     ["read", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["write", "noop", "noop", "noop", "noop"],
  //     ["read", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["write", "noop", "noop", "noop", "noop"],
  //   ],
  //   { "+": 2, "*": 4, "/": 8, "-": 3 },
  //   5,
  //   1,
  //   it.only
  // );

  // testCase(
  //   "a*b+g/h-c*d+e*f",
  //   [
  //     ["read", "read", "noop", "noop", "noop"],
  //     ["compute", "compute", "read", "read", "noop"],
  //     ["compute", "compute", "compute", "compute", "noop"],
  //     ["compute", "compute", "compute", "compute", "noop"],
  //     ["compute", "compute", "compute", "compute", "noop"],
  //     ["write", "write", "compute", "compute", "noop"],
  //     ["noop", "noop", "compute", "write", "read"],
  //     ["noop", "noop", "compute", "noop", "read"],
  //     ["noop", "noop", "compute", "noop", "compute"],
  //     ["noop", "noop", "compute", "noop", "compute"],
  //     ["noop", "noop", "write", "noop", "compute"],
  //     ["noop", "noop", "noop", "noop", "write"],
  //     ["read", "noop", "noop", "noop", "noop"],
  //     ["read", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["write", "noop", "noop", "noop", "noop"],
  //     ["read", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["compute", "noop", "noop", "noop", "noop"],
  //     ["write", "noop", "noop", "noop", "noop"],
  //   ],
  //   { "+": 2, "*": 4, "/": 8, "-": 3 },
  //   5,
  //   2,
  //   it.only
  // );
});
