import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { parseExpr } from "../src/parser.js";
import { parseTokens } from "../src/tokens.js";
import { treeExpression } from "../src/tree.js";
import { printTree } from "../src/utils.js";
import { treeOptimizer } from "../src/optimizer.js";

describe("parsing", () => {
  const testCase = (src, expectedTree, _it: any = it) =>
    _it(`optimizes tree in example '${src}'`, () => {
      const [tokens, _errors] = parseTokens(src);
      // console.log(tokens);

      const [, tree] = parseExpr()(tokens);
      const exprTree = treeExpression(tree);
      console.dir({ tree: treeOptimizer(exprTree)[0] }, { depth: null });
      console.log(printTree(exprTree));
      console.log(printTree(treeOptimizer(exprTree)[0]));
      const optimizedTree = treeOptimizer(exprTree)[0];
      // let map = new FileMap();
      // const fileName = "test";
      // map.addFile(fileName, src);
      // printErrors(errors, tokens, map, fileName);

      expect(optimizedTree).toEqual(expectedTree);
      // expect(true).toEqual(false);
    });

  testCase("a+b", { name: "+", children: [{ name: "a" }, { name: "b" }] });

  testCase("a+b+c", {
    name: "+",
    children: [
      { name: "+", children: [{ name: "a" }, { name: "b" }] },
      { name: "c" },
    ],
  });

  testCase("a+b+c+d", {
    name: "+",
    children: [
      { name: "+", children: [{ name: "a" }, { name: "b" }] },
      { name: "+", children: [{ name: "c" }, { name: "d" }] },
    ],
  });

  testCase("a+b+c+d+e", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "a" }, { name: "b" }] },
          { name: "c" },
        ],
      },
      { name: "+", children: [{ name: "d" }, { name: "e" }] },
    ],
  });

  testCase("a+b+c+d+e+f", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "a" }, { name: "b" }] },
          { name: "+", children: [{ name: "c" }, { name: "d" }] },
        ],
      },
      { name: "+", children: [{ name: "e" }, { name: "f" }] },
    ],
  });

  testCase("a+b+c+d+e+f+g", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "a" }, { name: "b" }] },
          { name: "c" },
        ],
      },
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "d" }, { name: "e" }] },
          { name: "+", children: [{ name: "f" }, { name: "g" }] },
        ],
      },
    ],
  });

  testCase("a+b+c+d+e+f+g+h", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "a" }, { name: "b" }] },
          { name: "+", children: [{ name: "c" }, { name: "d" }] },
        ],
      },
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "e" }, { name: "f" }] },
          { name: "+", children: [{ name: "g" }, { name: "h" }] },
        ],
      },
    ],
  });

  testCase("a+b+c+d+e+f+g+h+a2+b2+c2+d2+e2+f2+g2+h2", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          {
            name: "+",
            children: [
              { name: "+", children: [{ name: "a" }, { name: "b" }] },
              { name: "+", children: [{ name: "c" }, { name: "d" }] },
            ],
          },
          {
            name: "+",
            children: [
              { name: "+", children: [{ name: "e" }, { name: "f" }] },
              { name: "+", children: [{ name: "g" }, { name: "h" }] },
            ],
          },
        ],
      },
      {
        name: "+",
        children: [
          {
            name: "+",
            children: [
              { name: "+", children: [{ name: "a2" }, { name: "b2" }] },
              { name: "+", children: [{ name: "c2" }, { name: "d2" }] },
            ],
          },
          {
            name: "+",
            children: [
              { name: "+", children: [{ name: "e2" }, { name: "f2" }] },
              { name: "+", children: [{ name: "g2" }, { name: "h2" }] },
            ],
          },
        ],
      },
    ],
  });

  testCase("a-b-c-d-e-f-g-h", {
    name: "-",
    children: [
      {
        name: "-",
        children: [
          { name: "-", children: [{ name: "a" }, { name: "b" }] },
          { name: "+", children: [{ name: "c" }, { name: "d" }] },
        ],
      },
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "e" }, { name: "f" }] },
          { name: "+", children: [{ name: "g" }, { name: "h" }] },
        ],
      },
    ],
  });

  testCase("a+(b+c+d+(e+f)+g)+h", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "a" }, { name: "b" }] },
          { name: "+", children: [{ name: "c" }, { name: "d" }] },
        ],
      },
      {
        name: "+",
        children: [
          { name: "+", children: [{ name: "e" }, { name: "f" }] },
          { name: "+", children: [{ name: "g" }, { name: "h" }] },
        ],
      },
    ],
  });

  testCase("a-b+c+d+e-f+g-h", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          { name: "-", children: [{ name: "a" }, { name: "b" }] },
          { name: "+", children: [{ name: "c" }, { name: "d" }] },
        ],
      },
      {
        name: "+",
        children: [
          { name: "-", children: [{ name: "e" }, { name: "f" }] },
          { name: "-", children: [{ name: "g" }, { name: "h" }] },
        ],
      },
    ],
  });

  testCase("a-((b-c-d)-(e-f)-g)-h", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          { name: "-", children: [{ name: "a" }, { name: "b" }] },
          { name: "+", children: [{ name: "c" }, { name: "d" }] },
        ],
      },
      {
        name: "+",
        children: [
          { name: "-", children: [{ name: "e" }, { name: "f" }] },
          { name: "-", children: [{ name: "g" }, { name: "h" }] },
        ],
      },
    ],
  });

  testCase("a/b/c/d/e/f/g/h", {
    name: "/",
    children: [
      {
        name: "/",
        children: [
          { children: [{ name: "a" }, { name: "b" }], name: "/" },
          { name: "*", children: [{ name: "c" }, { name: "d" }] },
        ],
      },
      {
        name: "*",
        children: [
          { name: "*", children: [{ name: "e" }, { name: "f" }] },
          { name: "*", children: [{ name: "g" }, { name: "h" }] },
        ],
      },
    ],
  });

  testCase("i/1.0 + 0 - 0*k*h + 2 - 4.8/2 + 1*e/2", {
    name: "+",
    children: [
      {
        name: "-",
        children: [
          {
            name: "+",
            children: [{ name: "i" }, { name: "2", type: "num" }],
          },
          { name: "2.4", type: "num" },
        ],
      },
      {
        children: [{ name: "e" }, { name: "2", type: "num" }],
        name: "/",
      },
    ],
  });

  testCase("a*2/0 + b/(b+b*0-1*b) - 1/(c*2*4.76*(1-2+1))", {
    name: "+",
    children: [
      {
        children: [
          {
            children: [{ name: "a" }, { name: "2", type: "num" }],
            name: "*",
          },
          { name: "0", type: "num" },
        ],
        name: "/",
      },
      {
        name: "-",
        children: [
          { children: [{ name: "b" }, { name: "0" }], name: "/" },
          {
            children: [{ name: "1", type: "num" }, { name: "0" }],
            name: "/",
          },
        ],
      },
    ],
  });
});
