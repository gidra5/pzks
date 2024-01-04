import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { stringFromTree, treeExprFromString } from "../src/tree.js";
import { costs, count, printTree, take } from "../src/utils.js";
import { sortByCost, treeOptimizer } from "../src/optimizer.js";
import { CostTable } from "../src/types.js";
import { generateAllCommutations } from "../src/commutations.js";

describe("commutation", () => {
  const testCase = (src, expectedTrees, _costs: CostTable = costs, _it: any = it) =>
    _it(`generates commutations in example '${src}'`, () => {
      const exprTree = treeExprFromString(src);
      // console.log(printTree(exprTree));
      const balancedTree = treeOptimizer(exprTree)[0];
      const commutations = [...take(100, generateAllCommutations(balancedTree))];
      // console.dir({ commutations }, { depth: null });
      // console.log(printTree(balancedTree));
      console.log(commutations.map(stringFromTree));
      // let map = new FileMap();
      // const fileName = "test";
      // map.addFile(fileName, src);
      // printErrors(errors, tokens, map, fileName);

      // console.log(optimizedTree, expectedTree);

      expect(commutations).toEqual(expectedTrees.map(treeExprFromString));
      // expect(true).toEqual(false);
    });
  const testCaseLength = (src, expectedCount, _costs: CostTable = costs, _it: any = it) =>
    _it(`counts commutations in example '${src}'`, () => {
      const exprTree = treeExprFromString(src);
      // console.log(printTree(exprTree));
      const balancedTree = treeOptimizer(exprTree)[0];
      const commutationsCount = count(generateAllCommutations(balancedTree));
      // const count = 0;
      // console.dir({ commutations }, { depth: null });
      // console.log(printTree(balancedTree));
      // console.log(commutations.map(stringFromTree));
      // let map = new FileMap();
      // const fileName = "test";
      // map.addFile(fileName, src);
      // printErrors(errors, tokens, map, fileName);

      // console.log(optimizedTree, expectedTree);

      expect(commutationsCount).toEqual(expectedCount);
      // expect(true).toEqual(false);
    });

  testCase("a-b*c+k", [
    "a - ((b * c) - k)",
    "a + (k - (b * c))",
    "(-(b * c)) + (a + k)",
    "(-(b * c)) + (k + a)",
    "k - ((b * c) - a)",
    "k + (a - (b * c))",
    "a - ((c * b) - k)",
    "a + (k - (c * b))",
    "(-(c * b)) + (a + k)",
    "(-(c * b)) + (k + a)",
    "k - ((c * b) - a)",
    "k + (a - (c * b))",
  ]);
  testCase("a+b*c+k", [
    "a + ((b * c) + k)",
    "((b * c) + k) + a",
    "a + (k + (b * c))",
    "(k + (b * c)) + a",
    "a + ((c * b) + k)",
    "((c * b) + k) + a",
    "a + (k + (c * b))",
    "(k + (c * b)) + a",
  ]);
  testCase("a*(b+c)", ["a * (b + c)", "(b + c) * a", "a * (c + b)", "(c + b) * a"]);

  // testCaseLength("A - B*c - L*k*2 + D*t/d*y - H + Q*3 - J*(w-1)/r + P", 9216);
  // testCaseLength("A-B*c-J*(d*t*j-u*t+c*r-1+w-k/q+m*(n-k*s+z*(y+u*p-y/r-5)+x+t/2))/r+P", 1572864, {});
  // testCaseLength("a + b*c + d + e*f*g + h*i + j*(k + L + m*(n-p*q+r) - s*t)", 196608);
  // testCaseLength(
  //   "exp(sin(a+b/2-pi)+a*cos(a*pi+b*pi/3-w+k*t)-5+log(2.72)/T-1)+2048+a+b*c+log(t-1)-2*log(Q)-8*d/dt*exp(t/2+H)-sin(a)/cos(a)",
  //   14155776
  // );
  // testCaseLength(
  //   "a-b*k+b*t-b*f*f*5.9+b*f*q+b*g*f*5.9-b*g*q-b*w/p+b*y*m/p-b*y/p-x*x/(d+q-w)+3*x/(d+q-w)+3*x/(d+q-w)+3*3/(d+q-w)",
  //   196608
  // );
});
