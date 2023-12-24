import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";
import { treeExpression } from "../src/tree.js";
import { treeOptimizer } from "../src/optimizer.js";
import { machineStates } from "../src/machine.js";
import { printTree } from "../src/utils.js";

describe("parsing", () => {
  const testCase = (src, expectedStates, costs = {}, _it: any = it) =>
    _it(`simulates tree in example '${src}'`, () => {
      const [tokens, _errors] = parseTokens(src);

      const [, tree] = parseExpr()(tokens);
      const exprTree = treeExpression(tree);
      const optimizedTree = treeOptimizer(exprTree)[0];
      const states = machineStates(optimizedTree, costs);
      console.log(printTree(optimizedTree));
      console.log(states, states.length);

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
      ["write", "compute"],
      ["noop", "compute"],
      ["noop", "compute"],
      ["noop", "write"],
      ["read", "noop"],
      ["compute", "noop"],
      ["compute", "noop"],
      ["write", "noop"],
    ],
    { "+": 2, "*": 4 },
    it.only
  );

  // it.only(`simulates tree in example`, () => {
  //   const [tokens, _errors] = parseTokens("a*b+c*d+e*f");

  //   const [, tree] = parseExpr()(tokens);
  //   const exprTree = treeExpression(tree);
  //   const optimizedTree = treeOptimizer(exprTree)[0];
  //   console.log(printTree(optimizedTree));

  //   const states = machineStates(optimizedTree, {}, 3, 2);
  //   console.log(states, states.length);
  //   const states2 = machineStates(optimizedTree, {}, 2, 1);
  //   console.log(states2, states2.length);
  //   const states3 = machineStates(optimizedTree, {}, 5, 5);
  //   console.log(states3, states3.length);

  //   expect(states).toEqual([]);
  // });
});
