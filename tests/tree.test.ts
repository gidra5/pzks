import { describe, expect } from "vitest";
import { it } from "@fast-check/vitest";
import { treeExprFromString } from "../src/tree.js";
import { treeOptimizer } from "../src/optimizer.js";
import { Tree, printTree } from "../src/utils.js";

describe("parsing", () => {
  const testCase = (src, expectedTree, _it: any = it) =>
    _it(`optimizes tree in example '${src}'`, () => {
      const exprTree = treeExprFromString(src);
      // console.log(printTree(exprTree));
      const optimizedTree = treeOptimizer(exprTree)[0];
      // console.dir({ tree: optimizedTree }, { depth: null });
      // console.log(printTree(optimizedTree));
      // let map = new FileMap();
      // const fileName = "test";
      // map.addFile(fileName, src);
      // printErrors(errors, tokens, map, fileName);

      // console.log(optimizedTree, expectedTree);

      expect(optimizedTree).toEqual(expectedTree);
      // expect(true).toEqual(false);
    });

  // testCase("a-b*c+k", {
  //   name: "-",
  //   children: [
  //     {
  //       name: "+",
  //       children: [
  //         { name: "a", type: "name" },
  //         { name: "k", type: "name" },
  //       ],
  //     },
  //     {
  //       children: [
  //         { name: "b", type: "name" },
  //         { name: "c", type: "name" },
  //       ],
  //       name: "*",
  //     },
  //   ],
  // });

  testCase("a+b", {
    children: [
      { name: "a", type: "name" },
      { name: "b", type: "name" },
    ],
    name: "+",
  });

  testCase("a+b+c", {
    children: [
      {
        children: [
          { name: "a", type: "name" },
          { name: "b", type: "name" },
        ],
        name: "+",
      },
      { name: "c", type: "name" },
    ],
    name: "+",
  });

  testCase("a+b+c+d", {
    name: "+",
    children: [
      {
        children: [
          { name: "a", type: "name" },
          { name: "b", type: "name" },
        ],
        name: "+",
      },
      {
        name: "+",
        children: [
          { name: "c", type: "name" },
          { name: "d", type: "name" },
        ],
      },
    ],
  });

  testCase("a+b+c+d+e", {
    name: "+",
    children: [
      {
        children: [
          {
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
            name: "+",
          },
          { name: "c", type: "name" },
        ],
        name: "+",
      },
      {
        name: "+",
        children: [
          { name: "d", type: "name" },
          { name: "e", type: "name" },
        ],
      },
    ],
  });

  testCase("a+b+c+d+e+f", {
    name: "+",
    children: [
      {
        name: "+",
        children: [
          {
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
            name: "+",
          },
          {
            name: "+",
            children: [
              { name: "c", type: "name" },
              { name: "d", type: "name" },
            ],
          },
        ],
      },
      {
        name: "+",
        children: [
          { name: "e", type: "name" },
          { name: "f", type: "name" },
        ],
      },
    ],
  });

  testCase("a+b+c+d+e+f+g", {
    name: "+",
    children: [
      {
        children: [
          {
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
            name: "+",
          },
          { name: "c", type: "name" },
        ],
        name: "+",
      },
      {
        name: "+",
        children: [
          {
            name: "+",
            children: [
              { name: "d", type: "name" },
              { name: "e", type: "name" },
            ],
          },
          {
            name: "+",
            children: [
              { name: "f", type: "name" },
              { name: "g", type: "name" },
            ],
          },
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
          {
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
            name: "+",
          },
          {
            name: "+",
            children: [
              { name: "c", type: "name" },
              { name: "d", type: "name" },
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
              { name: "e", type: "name" },
              { name: "f", type: "name" },
            ],
          },
          {
            name: "+",
            children: [
              { name: "g", type: "name" },
              { name: "h", type: "name" },
            ],
          },
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
              {
                children: [
                  { name: "a", type: "name" },
                  { name: "b", type: "name" },
                ],
                name: "+",
              },
              {
                name: "+",
                children: [
                  { name: "c", type: "name" },
                  { name: "d", type: "name" },
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
                  { name: "e", type: "name" },
                  { name: "f", type: "name" },
                ],
              },
              {
                name: "+",
                children: [
                  { name: "g", type: "name" },
                  { name: "h", type: "name" },
                ],
              },
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
              {
                name: "+",
                children: [
                  { name: "a2", type: "name" },
                  { name: "b2", type: "name" },
                ],
              },
              {
                name: "+",
                children: [
                  { name: "c2", type: "name" },
                  { name: "d2", type: "name" },
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
                  { name: "e2", type: "name" },
                  { name: "f2", type: "name" },
                ],
              },
              {
                name: "+",
                children: [
                  { name: "g2", type: "name" },
                  { name: "h2", type: "name" },
                ],
              },
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
          {
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
            name: "-",
          },
          {
            name: "+",
            children: [
              { name: "c", type: "name" },
              { name: "d", type: "name" },
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
              { name: "e", type: "name" },
              { name: "f", type: "name" },
            ],
          },
          {
            name: "+",
            children: [
              { name: "g", type: "name" },
              { name: "h", type: "name" },
            ],
          },
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
          {
            name: "+",
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
          },
          {
            name: "+",
            children: [
              { name: "c", type: "name" },
              { name: "d", type: "name" },
            ],
          },
        ],
      },
      {
        name: "+",
        children: [
          {
            children: [
              { name: "e", type: "name" },
              { name: "f", type: "name" },
            ],
            name: "+",
          },
          {
            name: "+",
            children: [
              { name: "g", type: "name" },
              { name: "h", type: "name" },
            ],
          },
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
          {
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
            name: "-",
          },
          {
            name: "+",
            children: [
              { name: "c", type: "name" },
              { name: "d", type: "name" },
            ],
          },
        ],
      },
      {
        name: "+",
        children: [
          {
            name: "-",
            children: [
              { name: "e", type: "name" },
              { name: "f", type: "name" },
            ],
          },
          {
            name: "-",
            children: [
              { name: "g", type: "name" },
              { name: "h", type: "name" },
            ],
          },
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
          {
            name: "-",
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
          },
          {
            name: "+",
            children: [
              { name: "c", type: "name" },
              { name: "d", type: "name" },
            ],
          },
        ],
      },
      {
        name: "+",
        children: [
          {
            children: [
              { name: "e", type: "name" },
              { name: "f", type: "name" },
            ],
            name: "-",
          },
          {
            name: "-",
            children: [
              { name: "g", type: "name" },
              { name: "h", type: "name" },
            ],
          },
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
          {
            children: [
              { name: "a", type: "name" },
              { name: "b", type: "name" },
            ],
            name: "/",
          },
          {
            name: "*",
            children: [
              { name: "c", type: "name" },
              { name: "d", type: "name" },
            ],
          },
        ],
      },
      {
        name: "*",
        children: [
          {
            name: "*",
            children: [
              { name: "e", type: "name" },
              { name: "f", type: "name" },
            ],
          },
          {
            name: "*",
            children: [
              { name: "g", type: "name" },
              { name: "h", type: "name" },
            ],
          },
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
            children: [
              { name: "i", type: "name" },
              { name: "2", type: "num" },
            ],
          },
          { name: "2.4", type: "num" },
        ],
      },
      {
        children: [
          { name: "e", type: "name" },
          { name: "2", type: "num" },
        ],
        name: "/",
      },
    ],
  });

  // testCase("i/1.0 + 0 - 0*k*h + 2 - 4.8/2 + 1*e/2", {
  //   name: "+",
  //   children: [
  //     {
  //       name: "+",
  //       children: [
  //         { name: "i", type: "name" },
  //         { name: "-0.4", type: "num" },
  //       ],
  //     },
  //     {
  //       children: [
  //         { name: "e", type: "name" },
  //         { name: "2", type: "num" },
  //       ],
  //       name: "/",
  //     },
  //   ],
  // });

  testCase("a*2/0 + b/(b+b*0-1*b) - 1/(c*2*4.76*(1-2+1))", {
    name: "+",
    children: [
      {
        children: [
          {
            children: [
              { name: "a", type: "name" },
              { name: "2", type: "num" },
            ],
            name: "*",
          },
          { name: "0", type: "num" },
        ],
        name: "/",
      },
      {
        name: "-",
        children: [
          {
            children: [
              { name: "b", type: "name" },
              { name: "0", type: "num" },
            ],
            name: "/",
          },
          {
            children: [
              { name: "1", type: "num" },
              { name: "0", type: "num" },
            ],
            name: "/",
          },
        ],
      },
    ],
  });

  testCase("(A+B)+C/D+G+(K/L+M+N)", {
    children: [
      {
        name: "+",
        children: [
          {
            children: [
              { name: "A", type: "name" },
              { name: "B", type: "name" },
            ],
            name: "+",
          },
          {
            name: "+",
            children: [
              {
                children: [
                  { name: "C", type: "name" },
                  { name: "D", type: "name" },
                ],
                name: "/",
              },
              { name: "G", type: "name" },
            ],
          },
        ],
      },
      {
        name: "+",
        children: [
          {
            children: [
              { name: "K", type: "name" },
              { name: "L", type: "name" },
            ],
            name: "/",
          },
          {
            name: "+",
            children: [
              { name: "M", type: "name" },
              { name: "N", type: "name" },
            ],
          },
        ],
      },
    ],
    name: "+",
  });
});
