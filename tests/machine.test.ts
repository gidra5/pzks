import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";
import {
  stringFromTree,
  treeExprFromString,
  treeExpression,
} from "../src/tree.js";
import { treeOptimizer } from "../src/optimizer.js";
import {
  calculateLoad,
  machineStates,
  searchOptimalCommutation,
  searchOptimalFactorization,
  searchOptimalFactorizationCommutation,
} from "../src/machine.js";
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
      const exprTree = treeExprFromString(src);
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

  const searchTestCase = (
    src,
    expectedOptimalTree,
    _costs: CostTable = costs,
    n = 2,
    m = 1,
    _it: any = it
  ) =>
    _it(`finds optimal tree in example '${src}'`, () => {
      const exprTree = treeExprFromString(src);
      const optimizedTree = treeOptimizer(exprTree)[0];
      // const optimalTree = searchOptimalCommutation(optimizedTree, _costs, n, m);
      // const optimalTree = searchOptimalFactorization(
      //   optimizedTree,
      //   _costs,
      //   n,
      //   m
      // );
      const optimalTree = searchOptimalFactorizationCommutation(
        optimizedTree,
        _costs,
        n,
        m
      );
      // const linearFraction = calcLinearFraction(optimizedTree);
      // const accelerationCoef = calcMaxAcceleration(linearFraction, n);
      // console.log({
      //   accelerationCoef,
      //   time: states.length,
      //   load: calculateLoad(states, n, m),
      // });

      // console.log(printTree(optimizedTree));
      // console.log(states, states.length);

      // console.dir({ optimalTree }, { depth: null });
      // console.log(printTree(optimalTree));
      console.log(stringFromTree(optimalTree));

      // expect(optimalTree).toEqual(expectedOptimalTree);
      expect(true).toEqual(false);
    });

  testCase(
    "a+b",
    [
      ["read (+ 0)", "noop"],
      ["compute (+ 0)", "noop"],
      ["write (+ 0)", "noop"],
    ],
    { "+": 1 }
  );

  testCase(
    "a+b+c+d",
    [
      ["read (+ 0)", "noop"],
      ["compute (+ 0)", "read (+ 1)"],
      ["write (+ 0)", "compute (+ 1)"],
      ["noop", "write (+ 1)"],
      ["read (+ 2)", "noop"],
      ["compute (+ 2)", "noop"],
      ["write (+ 2)", "noop"],
    ],
    { "+": 1 }
  );

  testCase(
    "a*b+c*d",
    [
      ["read (* 0)", "noop"],
      ["compute (* 0)", "read (* 1)"],
      ["compute (* 0)", "compute (* 1)"],
      ["compute (* 0)", "compute (* 1)"],
      ["compute (* 0)", "compute (* 1)"],
      ["write (* 0)", "compute (* 1)"],
      ["noop", "write (* 1)"],
      ["read (+ 2)", "noop"],
      ["compute (+ 2)", "noop"],
      ["write (+ 2)", "noop"],
    ],
    { "+": 1, "*": 4 }
  );
  testCase("a*b+c*d+e*f", [
    ["read (* 0)", "noop"],
    ["compute (* 0)", "read (* 1)"],
    ["compute (* 0)", "compute (* 1)"],
    ["compute (* 0)", "compute (* 1)"],
    ["compute (* 0)", "compute (* 1)"],
    ["write (* 0)", "compute (* 1)"],
    ["noop", "write (* 1)"],
    ["read (* 2)", "noop"],
    ["compute (* 2)", "read (+ 3)"],
    ["compute (* 2)", "compute (+ 3)"],
    ["compute (* 2)", "compute (+ 3)"],
    ["compute (* 2)", "write (+ 3)"],
    ["write (* 2)", "noop"],
    ["read (+ 4)", "noop"],
    ["compute (+ 4)", "noop"],
    ["compute (+ 4)", "noop"],
    ["write (+ 4)", "noop"],
  ]);
  testCase("a*b+g/h-c*d+e*f", [
    ["read (* 0)", "noop"],
    ["compute (* 0)", "read (* 1)"],
    ["compute (* 0)", "compute (* 1)"],
    ["compute (* 0)", "compute (* 1)"],
    ["compute (* 0)", "compute (* 1)"],
    ["write (* 0)", "compute (* 1)"],
    ["noop", "write (* 1)"],
    ["read (/ 2)", "noop"],
    ["compute (/ 2)", "read (* 3)"],
    ["compute (/ 2)", "compute (* 3)"],
    ["compute (/ 2)", "compute (* 3)"],
    ["compute (/ 2)", "compute (* 3)"],
    ["compute (/ 2)", "compute (* 3)"],
    ["compute (/ 2)", "write (* 3)"],
    ["compute (/ 2)", "noop"],
    ["compute (/ 2)", "noop"],
    ["write (/ 2)", "noop"],
    ["read (- 4)", "noop"],
    ["compute (- 4)", "read (+ 5)"],
    ["compute (- 4)", "compute (+ 5)"],
    ["compute (- 4)", "compute (+ 5)"],
    ["write (- 4)", "noop"],
    ["noop", "write (+ 5)"],
    ["read (- 6)", "noop"],
    ["compute (- 6)", "noop"],
    ["compute (- 6)", "noop"],
    ["compute (- 6)", "noop"],
    ["write (- 6)", "noop"],
  ]);

  searchTestCase(
    "a-(b*k-b*t+b*f*f*5.9-b*f*q-b*g*f*5.9+b*g*q+b*w/p-b*y*m/p+b*y/p)-x*x/(d+q-w)+3*x/(d+q-w)+3*x/(d+q-w)+3*3/(d+q-w)",
    []
  );

  searchTestCase("a*b-2*a+b*c-c*2", []);
  // searchTestCase(
  //   "a-b*k+b*t-b*f*f*5.9+b*f*q+b*g*f*5.9-b*g*q-b*w/p+b*y*m/p-b*y/p-x*x/(d+q-w)+3*x/(d+q-w)+3*x/(d+q-w)+3*3/(d+q-w)",
  //   []
  // );

  // searchTestCase(
  //   "A-B*c-J*(d*t*j-u*t+c*r-1+w-k/q+m*(n-k*s+z*(y+u*p-y/r-5)+x+t/2))/r+P",
  //   {
  //     name: "-",
  //     children: [
  //       {
  //         name: "-",
  //         children: [
  //           { name: "A", type: "name" },
  //           {
  //             children: [
  //               { name: "B", type: "name" },
  //               { name: "c", type: "name" },
  //             ],
  //             name: "*",
  //           },
  //         ],
  //       },
  //       {
  //         name: "-",
  //         children: [
  //           {
  //             children: [
  //               {
  //                 children: [
  //                   { name: "J", type: "name" },
  //                   {
  //                     children: [
  //                       {
  //                         name: "+",
  //                         children: [
  //                           {
  //                             children: [
  //                               {
  //                                 children: [
  //                                   {
  //                                     children: [
  //                                       { name: "d", type: "name" },
  //                                       { name: "t", type: "name" },
  //                                     ],
  //                                     name: "*",
  //                                   },
  //                                   { name: "j", type: "name" },
  //                                 ],
  //                                 name: "*",
  //                               },
  //                               {
  //                                 children: [
  //                                   { name: "u", type: "name" },
  //                                   { name: "t", type: "name" },
  //                                 ],
  //                                 name: "*",
  //                               },
  //                             ],
  //                             name: "-",
  //                           },
  //                           {
  //                             name: "+",
  //                             children: [
  //                               {
  //                                 name: "-",
  //                                 children: [
  //                                   {
  //                                     children: [
  //                                       { name: "c", type: "name" },
  //                                       { name: "r", type: "name" },
  //                                     ],
  //                                     name: "*",
  //                                   },
  //                                   { name: "1", type: "num" },
  //                                 ],
  //                               },
  //                               {
  //                                 name: "-",
  //                                 children: [
  //                                   { name: "w", type: "name" },
  //                                   {
  //                                     children: [
  //                                       { name: "k", type: "name" },
  //                                       { name: "q", type: "name" },
  //                                     ],
  //                                     name: "/",
  //                                   },
  //                                 ],
  //                               },
  //                             ],
  //                           },
  //                         ],
  //                       },
  //                       {
  //                         children: [
  //                           { name: "m", type: "name" },
  //                           {
  //                             name: "+",
  //                             children: [
  //                               {
  //                                 name: "+",
  //                                 children: [
  //                                   {
  //                                     children: [
  //                                       { name: "n", type: "name" },
  //                                       {
  //                                         children: [
  //                                           { name: "k", type: "name" },
  //                                           { name: "s", type: "name" },
  //                                         ],
  //                                         name: "*",
  //                                       },
  //                                     ],
  //                                     name: "-",
  //                                   },
  //                                   {
  //                                     children: [
  //                                       { name: "z", type: "name" },
  //                                       {
  //                                         name: "-",
  //                                         children: [
  //                                           {
  //                                             children: [
  //                                               {
  //                                                 name: "y",
  //                                                 type: "name",
  //                                               },
  //                                               {
  //                                                 children: [
  //                                                   {
  //                                                     name: "u",
  //                                                     type: "name",
  //                                                   },
  //                                                   {
  //                                                     name: "p",
  //                                                     type: "name",
  //                                                   },
  //                                                 ],
  //                                                 name: "*",
  //                                               },
  //                                             ],
  //                                             name: "+",
  //                                           },
  //                                           {
  //                                             name: "+",
  //                                             children: [
  //                                               {
  //                                                 children: [
  //                                                   {
  //                                                     name: "y",
  //                                                     type: "name",
  //                                                   },
  //                                                   {
  //                                                     name: "r",
  //                                                     type: "name",
  //                                                   },
  //                                                 ],
  //                                                 name: "/",
  //                                               },
  //                                               {
  //                                                 name: "5",
  //                                                 type: "num",
  //                                               },
  //                                             ],
  //                                           },
  //                                         ],
  //                                       },
  //                                     ],
  //                                     name: "*",
  //                                   },
  //                                 ],
  //                               },
  //                               {
  //                                 name: "+",
  //                                 children: [
  //                                   { name: "x", type: "name" },
  //                                   {
  //                                     children: [
  //                                       { name: "t", type: "name" },
  //                                       { name: "2", type: "num" },
  //                                     ],
  //                                     name: "/",
  //                                   },
  //                                 ],
  //                               },
  //                             ],
  //                           },
  //                         ],
  //                         name: "*",
  //                       },
  //                     ],
  //                     name: "+",
  //                   },
  //                 ],
  //                 name: "*",
  //               },
  //               { name: "r", type: "name" },
  //             ],
  //             name: "/",
  //           },
  //           { name: "P", type: "name" },
  //         ],
  //       },
  //     ],
  //   }
  // );

  // searchTestCase(
  //   "a-b*k+b*t-b*f*f*5.9+b*f*q+b*g*f*5.9-b*g*q-b*w/p+b*y*m/p-b*y/p-x*x/(d+q-w)+3*x/(d+q-w)+3*x/(d+q-w)+3*3/(d+q-w)",
  //   {
  //     name: "-",
  //     children: [
  //       {
  //         name: "-",
  //         children: [
  //           { name: "A", type: "name" },
  //           {
  //             children: [
  //               { name: "B", type: "name" },
  //               { name: "c", type: "name" },
  //             ],
  //             name: "*",
  //           },
  //         ],
  //       },
  //       {
  //         name: "-",
  //         children: [
  //           {
  //             children: [
  //               {
  //                 children: [
  //                   { name: "J", type: "name" },
  //                   {
  //                     children: [
  //                       {
  //                         name: "+",
  //                         children: [
  //                           {
  //                             children: [
  //                               {
  //                                 children: [
  //                                   {
  //                                     children: [
  //                                       { name: "d", type: "name" },
  //                                       { name: "t", type: "name" },
  //                                     ],
  //                                     name: "*",
  //                                   },
  //                                   { name: "j", type: "name" },
  //                                 ],
  //                                 name: "*",
  //                               },
  //                               {
  //                                 children: [
  //                                   { name: "u", type: "name" },
  //                                   { name: "t", type: "name" },
  //                                 ],
  //                                 name: "*",
  //                               },
  //                             ],
  //                             name: "-",
  //                           },
  //                           {
  //                             name: "+",
  //                             children: [
  //                               {
  //                                 name: "-",
  //                                 children: [
  //                                   {
  //                                     children: [
  //                                       { name: "c", type: "name" },
  //                                       { name: "r", type: "name" },
  //                                     ],
  //                                     name: "*",
  //                                   },
  //                                   { name: "1", type: "num" },
  //                                 ],
  //                               },
  //                               {
  //                                 name: "-",
  //                                 children: [
  //                                   { name: "w", type: "name" },
  //                                   {
  //                                     children: [
  //                                       { name: "k", type: "name" },
  //                                       { name: "q", type: "name" },
  //                                     ],
  //                                     name: "/",
  //                                   },
  //                                 ],
  //                               },
  //                             ],
  //                           },
  //                         ],
  //                       },
  //                       {
  //                         children: [
  //                           { name: "m", type: "name" },
  //                           {
  //                             name: "+",
  //                             children: [
  //                               {
  //                                 name: "+",
  //                                 children: [
  //                                   {
  //                                     children: [
  //                                       { name: "n", type: "name" },
  //                                       {
  //                                         children: [
  //                                           { name: "k", type: "name" },
  //                                           { name: "s", type: "name" },
  //                                         ],
  //                                         name: "*",
  //                                       },
  //                                     ],
  //                                     name: "-",
  //                                   },
  //                                   {
  //                                     children: [
  //                                       { name: "z", type: "name" },
  //                                       {
  //                                         name: "-",
  //                                         children: [
  //                                           {
  //                                             children: [
  //                                               {
  //                                                 name: "y",
  //                                                 type: "name",
  //                                               },
  //                                               {
  //                                                 children: [
  //                                                   {
  //                                                     name: "u",
  //                                                     type: "name",
  //                                                   },
  //                                                   {
  //                                                     name: "p",
  //                                                     type: "name",
  //                                                   },
  //                                                 ],
  //                                                 name: "*",
  //                                               },
  //                                             ],
  //                                             name: "+",
  //                                           },
  //                                           {
  //                                             name: "+",
  //                                             children: [
  //                                               {
  //                                                 children: [
  //                                                   {
  //                                                     name: "y",
  //                                                     type: "name",
  //                                                   },
  //                                                   {
  //                                                     name: "r",
  //                                                     type: "name",
  //                                                   },
  //                                                 ],
  //                                                 name: "/",
  //                                               },
  //                                               {
  //                                                 name: "5",
  //                                                 type: "num",
  //                                               },
  //                                             ],
  //                                           },
  //                                         ],
  //                                       },
  //                                     ],
  //                                     name: "*",
  //                                   },
  //                                 ],
  //                               },
  //                               {
  //                                 name: "+",
  //                                 children: [
  //                                   { name: "x", type: "name" },
  //                                   {
  //                                     children: [
  //                                       { name: "t", type: "name" },
  //                                       { name: "2", type: "num" },
  //                                     ],
  //                                     name: "/",
  //                                   },
  //                                 ],
  //                               },
  //                             ],
  //                           },
  //                         ],
  //                         name: "*",
  //                       },
  //                     ],
  //                     name: "+",
  //                   },
  //                 ],
  //                 name: "*",
  //               },
  //               { name: "r", type: "name" },
  //             ],
  //             name: "/",
  //           },
  //           { name: "P", type: "name" },
  //         ],
  //       },
  //     ],
  //   }
  // );

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
