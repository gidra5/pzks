import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { stringFromTree, treeExprFromString } from "../src/tree.js";
import { costs } from "../src/utils.js";
import { generateAllFactorizations, treeOptimizer } from "../src/optimizer.js";
import { CostTable } from "../src/types.js";

describe("commutation", () => {
  const testCase = (
    src,
    expectedTrees,
    _costs: CostTable = costs,
    _it: any = it
  ) =>
    _it(`optimizes tree in example '${src}'`, () => {
      const exprTree = treeExprFromString(src);
      // console.log(printTree(exprTree));
      const balancedTree = treeOptimizer(exprTree)[0];
      const distributions = [...generateAllFactorizations(balancedTree)];
      // console.dir({ commutations }, { depth: null });
      // console.log(printTree(balancedTree));
      console.log(distributions.map(stringFromTree));
      // let map = new FileMap();
      // const fileName = "test";
      // map.addFile(fileName, src);
      // printErrors(errors, tokens, map, fileName);

      // console.log(optimizedTree, expectedTree);

      expect(distributions).toEqual(expectedTrees.map(treeExprFromString));
      // expect(true).toEqual(false);
    });
  const testCaseLength = (
    src,
    expectedTreesLength,
    _costs: CostTable = costs,
    _it: any = it
  ) =>
    _it(`optimizes tree in example '${src}'`, () => {
      const exprTree = treeExprFromString(src);
      // console.log(printTree(exprTree));
      const balancedTree = treeOptimizer(exprTree)[0];
      const commutations = [...generateAllFactorizations(balancedTree)];
      // const count = 0;
      // console.dir({ commutations }, { depth: null });
      // console.log(printTree(balancedTree));
      // console.log(commutations.map(stringFromTree));
      // let map = new FileMap();
      // const fileName = "test";
      // map.addFile(fileName, src);
      // printErrors(errors, tokens, map, fileName);

      // console.log(optimizedTree, expectedTree);

      expect(commutations.length).toEqual(expectedTreesLength);
      // expect(true).toEqual(false);
    });

  testCase("2*t + (2*h - t*h*2) - q*t", []);

  // testCase("a*b+a*c+b*c", [
  //   "((a * b) + (a * c)) + (b * c)",
  //   "((b + c) * a) + (b * c)",
  // ]);
  // testCase("a*(b-2)+c*(b-2)", [
  //   "(a * (b - 2)) + (c * (b - 2))",
  //   "(a + c) * (b - 2)",
  // ]);
  // testCase("a*b-2*a+b*c-c*2", [
  //   "((a * b) - (2 * a)) + ((b * c) - (c * 2))",
  //   "((b - 2) * a) + ((b - 2) * c)",
  //   "(a + c) * (b - 2)",
  // ]);

  // testCase("a/b-c/b+2/b", [
  //   "((a / b) - (c / b)) + (2 / b)",
  //   "((a - c) / b) + (2 / b)",
  //   "((a - c) + 2) / b",
  // ]);
  // testCase("a/(b-1)-c/(b-1)+2/(b-1)-t", [
  //   "((a / (b - 1)) - (c / (b - 1))) + ((2 / (b - 1)) - t)",
  //   "((a - c) / (b - 1)) + ((2 / (b - 1)) - t)",
  // ]);
  // testCase("a-b*k+b*t-f*f*5.9+f*q+g*f*5.9-g*q-f/(d+q-w)-g/(d+q-w)", [
  //   "((((a - (b * k)) + (b * t)) - (((f * f) * 5.9) - (f * q))) + (((g * f) * 5.9) - (g * q))) - ((f / ((d + q) - w)) + (g / ((d + q) - w)))",
  //   "((((a - (b * k)) + (b * t)) - (((f * f) * 5.9) - (f * q))) + (((g * f) * 5.9) - (g * q))) - ((f + g) / ((d + q) - w))",
  // ]);
  // testCase(
  //   "a-b*k+b*t-b*f*f*5.9+b*f*q+b*g*f*5.9-b*g*q-b*w/p+b*y*m/p-b*y/p-x*x/(d+q-w)+3*x/(d+q-w)+3*x/(d+q-w)+3*3/(d+q-w)",
  //   [
  //     "(((((a - (b * k)) + (b * t)) - ((b * f) * (f * 5.9))) + (((b * f) * q) + ((b * g) * (f * 5.9)))) - ((((b * g) * q) + ((b * w) / p)) - ((((b * y) * m) / p) - ((b * y) / p)))) - ((((x * x) / ((d + q) - w)) - ((3 * x) / ((d + q) - w))) - (((3 * x) / ((d + q) - w)) + (9 / ((d + q) - w))))",
  //     "(((((a - (b * k)) + (b * t)) - ((b * f) * (f * 5.9))) + (((b * f) * q) + ((b * g) * (f * 5.9)))) - ((((b * g) * q) + ((b * w) / p)) - ((((b * y) * m) - (b * y)) / p))) - ((((x * x) - (3 * x)) / ((d + q) - w)) - (((3 * x) + 9) / ((d + q) - w)))",
  //     "(((((a - (b * k)) + (b * t)) - ((b * f) * (f * 5.9))) + (((b * f) * q) + ((b * g) * (f * 5.9)))) - ((((b * g) * q) + ((b * w) / p)) - ((((b * y) * m) - (b * y)) / p))) - ((((x * x) - (3 * x)) - ((3 * x) + 9)) / ((d + q) - w))",
  //     "(((((a - (b * k)) + (b * t)) - ((b * f) * (f * 5.9))) + (((b * f) * q) + ((b * g) * (f * 5.9)))) - ((((b * g) * q) + ((b * w) / p)) - ((((b * y) * m) - (b * y)) / p))) - ((((x - 3) * x) - ((3 * x) + 9)) / ((d + q) - w))",
  //   ]
  // );
  // testCase(
  //   "A-B*c-J*(d*t*j-u*t+c*r-1+w-k/q+m*(n-k*s+z*(y+u*p-y/r-5)+x+t/2))/r+P",
  //   [
  //     "(A - (B * c)) - (((J * (((((d * t) * j) - (u * t)) + (((c * r) - 1) + (w - (k / q)))) + (m * (((n - (k * s)) + (z * ((y + (u * p)) - ((y / r) + 5)))) + (x + (t / 2)))))) / r) - P)",
  //   ]
  // );
});
