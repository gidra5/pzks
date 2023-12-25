import { parseExpr } from "./parser.js";
import { treeCost, treeExpression } from "./tree.js";
import { parseTokens } from "./tokens.js";
import { isEqual, type Tree } from "./utils";
import { CostTable } from "./types.js";

export const iterate =
  <T>(f: (x: T) => T, maxIterations = 10) =>
  (item: T): [T, boolean] => {
    let i = 0;
    let next = f(item);
    while (!isEqual(item, next)) {
      if (i >= maxIterations) {
        break;
      }
      item = next;
      next = f(item);
      i++;
    }

    return [next, i === 0];
  };

export const iterateAll = <T>(...fns: ((x: T) => [T, boolean])[]) =>
  iterate<T>((item) => fns.reduce((acc, fn) => fn(acc)[0], item));

export const treeOptimizerStep = (item: Tree): Tree => {
  if (patternMatcher("_ + (_ - _)", item)) {
    const { a, b, c } = patternMatcherDict("a + (b - c)", item);
    const canBalance = getDepth(a) < getDepth(item.children![1]);

    if (canBalance)
      return {
        name: "-",
        children: [
          treeOptimizerStep({
            name: "+",
            children: [a, b],
          }),
          treeOptimizerStep(c),
        ],
      };
  }

  if (patternMatcher("_ - (_ + _)", item)) {
    const { a, b, c } = patternMatcherDict("a - (b + c)", item);
    const canBalance = getDepth(a) < getDepth(item.children![1]);

    if (canBalance)
      return {
        name: "-",
        children: [
          treeOptimizerStep({
            name: "-",
            children: [a, b],
          }),
          treeOptimizerStep(c),
        ],
      };
  }

  if (patternMatcher("_ - (_ - _)", item)) {
    const { a, b, c } = patternMatcherDict("a - (b - c)", item);
    const canBalance = getDepth(a) < getDepth(item.children![1]);

    if (canBalance)
      return {
        name: "+",
        children: [
          treeOptimizerStep({
            name: "-",
            children: [a, b],
          }),
          treeOptimizerStep(c),
        ],
      };
  }

  if (
    patternMatcher("_ + (_ + _)", item) ||
    patternMatcher("_ * (_ * _)", item)
  ) {
    const [a, { name, children: [b, c] = [] }] = item.children!;
    const canBalance = getDepth(a) < getDepth(item.children![1]);

    if (canBalance)
      return {
        name: item.name,
        children: [
          treeOptimizerStep({
            name,
            children: [a, b],
          }),
          treeOptimizerStep(c),
        ],
      };
  }

  if (
    patternMatcher("(_ + _) + _", item) ||
    patternMatcher("(_ * _) * _", item)
  ) {
    const [{ name, children: [a, b] = [] }, c] = item.children!;
    const canBalance = getDepth(item.children![0]) > getDepth(c) + 1;

    if (canBalance)
      return {
        name,
        children: [
          treeOptimizerStep(a),
          treeOptimizerStep({
            name: item.name,
            children: [b, c],
          }),
        ],
      };
  }

  if (patternMatcher("(_ - _) - _", item)) {
    const [{ name, children: [a, b] = [] }, c] = item.children!;
    const canBalance = getDepth(item.children![0]) > getDepth(c) + 1;

    if (canBalance)
      return {
        name,
        children: [
          treeOptimizerStep(a),
          treeOptimizerStep({
            name: "+",
            children: [b, c],
          }),
        ],
      };
  }

  if (patternMatcher("(_ - _) + _", item)) {
    const [{ name, children: [a, b] = [] }, c] = item.children!;
    const canBalance = getDepth(item.children![0]) > getDepth(c) + 1;

    if (canBalance)
      return {
        name,
        children: [
          treeOptimizerStep(a),
          treeOptimizerStep({
            name: "-",
            children: [b, c],
          }),
        ],
      };
  }

  if (patternMatcher("(_ + _) - _", item)) {
    const [{ name, children: [a, b] = [] }, c] = item.children!;
    const canBalance = getDepth(item.children![0]) > getDepth(c) + 1;

    if (canBalance)
      return {
        name,
        children: [
          treeOptimizerStep(a),
          treeOptimizerStep({
            name: "-",
            children: [b, c],
          }),
        ],
      };
  }

  if (patternMatcher("(_ / _) / _", item)) {
    const [{ children: [a, b] = [] }, c] = item.children!;
    const canBalance = getDepth(item.children![0]) > getDepth(c) + 1;

    if (canBalance)
      return {
        name: "/",
        children: [
          treeOptimizerStep(a),
          treeOptimizerStep({
            name: "*",
            children: [b, c],
          }),
        ],
      };
  }

  if (patternMatcher("-(-_)", item)) {
    const { a } = patternMatcherDict("-(-a)", item);
    return a;
  }

  if (patternMatcher("_-(-_)", item)) {
    const { a, b } = patternMatcherDict("a-(-b)", item);
    return { name: "+", children: [a, b] };
  }

  if (patternMatcher("0+_", item)) {
    return item.children![1];
  }
  if (patternMatcher("_+0", item)) {
    return item.children![0];
  }
  if (patternMatcher("0-_", item)) {
    return { name: "neg", children: [item.children![1]] };
  }
  if (patternMatcher("_-0", item)) {
    return item.children![0];
  }
  if (
    patternMatcher("0*_", item) ||
    patternMatcher("_*0", item) ||
    patternMatcher("0/_", item)
  ) {
    return { name: "0", type: "num" };
  }
  // if (patternMatcher("_/0", item)) {
  //   console.warn("Division by zero");
  // }
  if (patternMatcher("1*_", item)) {
    return item.children![1];
  }
  if (patternMatcher("_*1", item)) {
    return item.children![0];
  }
  if (patternMatcher("_*(1/_)", item)) {
    const { a, b } = patternMatcherDict("a*(1/b)", item);
    return { name: "/", children: [a, b] };
  }
  if (patternMatcher("1/(1/_)", item)) {
    const { a } = patternMatcherDict("1/(1/a)", item);
    return a;
  }
  if (patternMatcher("_/1", item)) {
    return item.children![0];
  }

  if (patternMatcher("x - x", item)) {
    return { name: "0", type: "num" };
  }

  if (
    patternMatcher("x / x", item) &&
    isEqual(item.children![0], item.children![1])
  ) {
    return { name: "1", type: "num" };
  }

  if (
    item.children &&
    item.children.filter(({ type }) => type === "num").length > 1
  ) {
    const op = item.name;

    if (op === "+") {
      const value =
        Number(item.children![0].name) + Number(item.children![1].name);
      return { name: `${value}`, type: "num" };
    }
    if (op === "-") {
      const value =
        Number(item.children![0].name) - Number(item.children![1].name);
      return { name: `${value}`, type: "num" };
    }
    if (op === "*") {
      const value =
        Number(item.children![0].name) * Number(item.children![1].name);
      return { name: `${value}`, type: "num" };
    }
    if (op === "/" && Number(item.children![1].name) !== 0) {
      const value =
        Number(item.children![0].name) / Number(item.children![1].name);
      return { name: `${value}`, type: "num" };
    }
    if (op === "^") {
      const value = Math.pow(
        Number(item.children![0].name),
        Number(item.children![1].name)
      );
      return { name: `${value}`, type: "num" };
    }
  }

  if (item.children && item.children.length > 0) {
    const children = item.children.map(treeOptimizerStep);
    return { ...item, children };
  }

  return item;
};

export const sortByCostStep =
  (costTable: CostTable) =>
  (item: Tree): Tree => {
    if (item.children && item.children.length > 0) {
      item = {
        ...item,
        children: item.children.map(sortByCostStep(costTable)),
      };
    }

    const getCost = (item: Tree): number => treeCost(item, costTable);

    if (patternMatcher("_ + _", item)) {
      const [a, b] = item.children!;
      if (getCost(a) > getCost(b)) return { ...item, children: [b, a] };
    }

    if (patternMatcher("_ * _", item)) {
      const [a, b] = item.children!;
      if (getCost(a) > getCost(b)) return { ...item, children: [b, a] };
    }

    if (patternMatcher("(_ - _) - _", item)) {
      const { a, b, c } = patternMatcherDict("(a - b) - c", item);
      if (getCost(b) > getCost(c))
        return {
          name: "-",
          children: [{ name: "-", children: [a, c] }, b],
        };
    }

    if (patternMatcher("(_ / _) / _", item)) {
      const { a, b, c } = patternMatcherDict("(a / b) / c", item);
      if (getCost(b) > getCost(c))
        return {
          name: "/",
          children: [{ name: "/", children: [a, c] }, b],
        };
    }

    return item;
  };

export const distributeStep = (item: Tree): Tree => {
  if (item.children && item.children.length > 0) {
    item = { ...item, children: item.children.map(distributeStep) };
  }

  if (patternMatcher("_ * (_ + _)", item)) {
    const { a, b, c } = patternMatcherDict("a * (b + c)", item);
    return {
      name: "+",
      children: [
        { name: "*", children: [a, b] },
        { name: "*", children: [a, c] },
      ],
    };
  }

  if (patternMatcher("(_ + _) * _", item)) {
    const { a, b, c } = patternMatcherDict("(a + b) * c", item);
    return {
      name: "+",
      children: [
        { name: "*", children: [a, c] },
        { name: "*", children: [b, c] },
      ],
    };
  }

  if (patternMatcher("_ * (_ - _)", item)) {
    const { a, b, c } = patternMatcherDict("a * (b - c)", item);
    return {
      name: "-",
      children: [
        { name: "*", children: [a, b] },
        { name: "*", children: [a, c] },
      ],
    };
  }

  if (patternMatcher("(_ - _) * _", item)) {
    const { a, b, c } = patternMatcherDict("(a - b) * c", item);
    return {
      name: "-",
      children: [
        { name: "*", children: [a, c] },
        { name: "*", children: [b, c] },
      ],
    };
  }

  if (patternMatcher("(_ - _) / _", item)) {
    const { a, b, c } = patternMatcherDict("(a - b) / c", item);
    return {
      name: "-",
      children: [
        { name: "/", children: [a, c] },
        { name: "/", children: [b, c] },
      ],
    };
  }

  if (patternMatcher("(_ + _) / _", item)) {
    const { a, b, c } = patternMatcherDict("(a + b) / c", item);
    return {
      name: "+",
      children: [
        { name: "/", children: [a, c] },
        { name: "/", children: [b, c] },
      ],
    };
  }

  return item;
};

export const factorizeStep = (item: Tree): Tree => {
  if (item.children && item.children.length > 0) {
    item = { ...item, children: item.children.map(factorizeStep) };
  }

  if (patternMatcher("(_/b) + (_/b)", item)) {
    const { a, b, c } = patternMatcherDict("(a/b) + (c/b)", item);
    return {
      name: "/",
      children: [{ name: "+", children: [a, c] }, b],
    };
  }

  if (patternMatcher("(_/b) - (_/b)", item)) {
    const { a, b, c } = patternMatcherDict("(a/b) - (c/b)", item);
    return {
      name: "/",
      children: [{ name: "-", children: [a, c] }, b],
    };
  }

  if (patternMatcher("(_*_) - (_*_)", item)) {
    const { a, b, c, d } = patternMatcherDict("(a*b) - (c*d)", item);
    if (isEqual(b, d)) {
      return {
        name: "*",
        children: [{ name: "-", children: [a, c] }, b],
      };
    }
    if (isEqual(a, d)) {
      return {
        name: "*",
        children: [{ name: "-", children: [b, c] }, a],
      };
    }
    if (isEqual(b, c)) {
      return {
        name: "*",
        children: [{ name: "-", children: [a, d] }, b],
      };
    }
    if (isEqual(a, c)) {
      return {
        name: "*",
        children: [{ name: "-", children: [b, d] }, c],
      };
    }
  }

  if (patternMatcher("(_*_) + (_*_)", item)) {
    const { a, b, c, d } = patternMatcherDict("(a*b) + (c*d)", item);
    if (isEqual(b, d)) {
      return {
        name: "*",
        children: [{ name: "+", children: [a, c] }, b],
      };
    }
    if (isEqual(a, d)) {
      return {
        name: "*",
        children: [{ name: "+", children: [b, c] }, a],
      };
    }
    if (isEqual(b, c)) {
      return {
        name: "*",
        children: [{ name: "+", children: [a, d] }, b],
      };
    }
    if (isEqual(a, c)) {
      return {
        name: "*",
        children: [{ name: "+", children: [b, d] }, c],
      };
    }
  }

  return item;
};

export const sortByCost = (costTable: CostTable = {}) =>
  iterate(sortByCostStep(costTable));

export const distribute = iterate(distributeStep);

export const factorize = iterate(factorizeStep);

export const treeOptimizer = iterate(treeOptimizerStep);

const getDepth = (item: Tree): number => {
  if (item.children === undefined) {
    return 0;
  }
  return 1 + Math.max(...item.children.map(getDepth));
};

const treeMatcher = (
  item: Tree,
  matcher: Tree,
  dict: Record<string, Tree> = {}
): [boolean, Record<string, Tree>] => {
  if (matcher.name === "_") {
    return [true, dict];
  }

  if (matcher.name in dict) {
    return [isEqual(dict[matcher.name], item), dict];
  } else if (matcher.type === "name") {
    return [true, { ...dict, [matcher.name]: item }];
  }

  if (item.name !== matcher.name) {
    return [false, dict];
  }

  if (item.children === matcher.children) {
    return [true, dict];
  }

  if (!(item.children && matcher.children)) {
    return [false, dict];
  }

  if (item.children.length !== matcher.children.length) {
    return [false, dict];
  }

  let acc: [boolean, Record<string, Tree>] = [true, dict];

  for (let i = 0; i < matcher.children.length; i++) {
    acc = treeMatcher(item.children[i], matcher.children[i], acc[1]);
    if (!acc[0]) return acc;
  }

  return acc;
};

export const stringTreeMatcher = (pattern: string, item: Tree) => {
  const [, patternTree] = parseExpr()(parseTokens(pattern)[0]);

  return treeMatcher(item, treeExpression(patternTree));
};

export const patternMatcher = (pattern: string, item: Tree): boolean =>
  stringTreeMatcher(pattern, item)[0];

const patternMatcherDict = (
  pattern: string,
  item: Tree
): Record<string, Tree> => stringTreeMatcher(pattern, item)[1];
