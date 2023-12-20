import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";
import { treeExpression } from "../src/tree.js";
import { treeOptimizer } from "../src/optimizer.js";
import { machineStates } from "../src/machine.js";

describe("parsing", () => {
  const testCase = (src, expectedStates, costs = {}, _it: any = it) =>
    _it(`simulates tree in example '${src}'`, () => {
      const [tokens, _errors] = parseTokens(src);

      const [, tree] = parseExpr()(tokens);
      const exprTree = treeExpression(tree);
      const optimizedTree = treeOptimizer(exprTree)[0];
      const states = machineStates(optimizedTree, costs);

      expect(states).toEqual(expectedStates);
    });

  testCase("a+b", [
    ["write", "noop"],
    ["compute", "noop"],
    ["read", "noop"],
  ]);
});
