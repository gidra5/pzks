import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";
import { treeExpression } from "../src/tree.js";
import { treeOptimizer } from "../src/optimizer.js";
import { calculateLoad, machineStates } from "../src/machine.js";
import {
  calcMaxAcceleration,
  calcLinearFraction,
  costs,
  printTree,
} from "../src/utils.js";
import { CostTable } from "../src/types.js";

describe("parsing", () => {
  const testCase = (
    src,
    expectedStates,
    _costs: CostTable = costs,
    n = 2,
    m = 1,
    _it: any = it
  ) =>
    _it(`simulates tree in example '${src}'`, () => {
      const [tokens, _errors] = parseTokens(src);

      const [, tree] = parseExpr()(tokens);
      const exprTree = treeExpression(tree);
      const optimizedTree = treeOptimizer(exprTree)[0];
      const states = machineStates(optimizedTree, _costs, n, m);
      // const linearFraction = calcLinearFraction(optimizedTree);
      // const accelerationCoef = calcMaxAcceleration(linearFraction, n);
      // console.log({
      //   accelerationCoef,
      //   time: states.length,
      //   load: calculateLoad(states, n, m),
      // });

      // console.log(printTree(optimizedTree));
      // console.log(states, states.length);

      expect(states).toEqual(expectedStates);
    });

  testCase(
    "a+b",
    [
      ["read", "noop"],
      ["compute", "noop"],
      ["write", "noop"],
    ],
    { "+": 1 }
  );

  testCase(
    "a+b+c+d",
    [
      ["read", "noop"],
      ["compute", "read"],
      ["write", "compute"],
      ["noop", "write"],
      ["read", "noop"],
      ["compute", "noop"],
      ["write", "noop"],
    ],
    { "+": 1 }
  );

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
  testCase("a*b+c*d+e*f", [
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
  ]);
  testCase("a*b+g/h-c*d+e*f", [
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
  ]);

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
