import { parseExpr } from "./parser.js";
import { treeCost, treeExpression } from "./tree.js";
import { parseTokens } from "./tokens.js";
import type { Tree } from "./utils";

export const treeOptimizer = (item: Tree): [Tree, boolean] => {
  let i = 0;
  while (JSON.stringify(item) !== JSON.stringify(treeOptimizerStep(item))) {
    if (i >= 11) {
      break;
    }
    item = treeOptimizerStep(item);
    i++;
  }

  return [item, i === 0];
};

export const treeOptimizerStep = (item: Tree): Tree => {
  if (patternMatcher("_ + (_ - _)", item)) {
    const [a, { children: [b, c] = [] }] = item.children!;
    const canBalance =
      getDepth(a) < getDepth(b) + 1 || getDepth(a) < getDepth(c) + 1;

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
    const [a, { children: [b, c] = [] }] = item.children!;
    const canBalance =
      getDepth(a) < getDepth(b) + 1 || getDepth(a) < getDepth(c) + 1;

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
    const [a, { children: [b, c] = [] }] = item.children!;
    const canBalance =
      getDepth(a) < getDepth(b) + 1 || getDepth(a) < getDepth(c) + 1;

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
    const canBalance =
      getDepth(a) < getDepth(b) + 1 || getDepth(a) < getDepth(c) + 1;

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
    const canBalance = getDepth(a) > getDepth(c) || getDepth(b) > getDepth(c);

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
    const canBalance = getDepth(a) > getDepth(c) || getDepth(b) > getDepth(c);

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
    const canBalance = getDepth(a) > getDepth(c) || getDepth(b) > getDepth(c);

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
    const canBalance = getDepth(a) > getDepth(c) || getDepth(b) > getDepth(c);

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
    const canBalance = getDepth(a) > getDepth(c) || getDepth(b) > getDepth(c);

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
    const [{ children: [a] = [] }] = item.children!;
    return a;
  }

  if (patternMatcher("_-(-_)", item)) {
    const [a, { children: [b] = [] }] = item.children!;
    return {
      name: "+",
      children: [a, b],
    };
  }

  if (patternMatcher("0+_", item)) {
    return item.children![1];
  }
  if (patternMatcher("_+0", item)) {
    return item.children![0];
  }
  if (patternMatcher("0-_", item)) {
    return { name: "-", children: [item.children![1]] };
  }
  if (patternMatcher("_-0", item)) {
    return item.children![0];
  }
  if (
    patternMatcher("0*_", item) ||
    patternMatcher("_*0", item) ||
    patternMatcher("0/_", item)
  ) {
    return { name: "0" };
  }
  if (patternMatcher("_/0", item)) {
    console.warn("Division by zero");
  }
  if (patternMatcher("1*_", item)) {
    return item.children![1];
  }
  if (patternMatcher("_*1", item)) {
    return item.children![0];
  }
  if (patternMatcher("_*(1/_)", item)) {
    const [a, { children: [, b] = [] }] = item.children!;
    return { name: "/", children: [a, b] };
  }
  if (patternMatcher("1/(1/_)", item)) {
    const [, { children: [, a] = [] }] = item.children!;
    return a;
  }
  if (patternMatcher("_/1", item)) {
    return item.children![0];
  }

  if (
    patternMatcher("_ - _", item) &&
    treeMatcher(item.children![0], item.children![1])[0]
  ) {
    return { name: "0" };
  }

  if (
    patternMatcher("_ / _", item) &&
    treeMatcher(item.children![0], item.children![1])[0]
  ) {
    return { name: "1" };
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
    if (op === "/") {
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

  // if (patternMatcher("_ + _", item)) {
  //   const [a, b] = item.children!;
  //   if (treeCost(a) > treeCost(b)) return { ...item, children: [b, a] };
  // }

  // if (patternMatcher("(_ - _) - _", item)) {
  //   const [{ children: [a, b] = [] }, c] = item.children!;
  //   if (treeCost(b) > treeCost(c)) return { name: "-", children: [{ name: "-", children: [a, c] }, b] };
  // }

  // if (patternMatcher("_ * _", item)) {
  //   const [a, b] = item.children!;
  //   if (treeCost(a) > treeCost(b)) return { ...item, children: [b, a] };
  // }

  // if (patternMatcher("_ * (_ + _)", item)) {
  //   const [a, { children: [b, c] = [] }] = item.children!;
  //   return {
  //     name: "+",
  //     children: [
  //       { name: "*", children: [a, b] },
  //       { name: "*", children: [a, c] },
  //     ],
  //   };
  // }

  if (item.children && item.children.length > 0) {
    const children = item.children.map(treeOptimizerStep);
    return { ...item, children };
  }

  return item;
};

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

  if (item.name !== matcher.name) {
    return [false, dict];
  }

  if (item.children === undefined && matcher.children === undefined) {
    return [true, dict];
  }
  if (!(item.children !== undefined && matcher.children !== undefined)) {
    return [false, dict];
  }
  if (item.children.length !== matcher.children.length) {
    return [false, dict];
  }

  return item.children.reduce(
    (acc, child, i) => {
      if (!acc[0]) return acc;
      if (!matcher.children) return [false, acc[1]];
      if (!matcher.children[i]) return [false, acc[1]];
      return treeMatcher(child, matcher.children[i], acc[1]);
    },
    [true as boolean, dict]
  );
};

const patternMatcher = (pattern: string, item: Tree): boolean => {
  const [, patternTree] = parseExpr()(parseTokens(pattern)[0]);
  // if (pattern === "a - a")
  //   console.dir(treeExpression(patternTree), { depth: null });

  return treeMatcher(item, treeExpression(patternTree))[0];
};

const patternMatcherDict = (
  pattern: string,
  item: Tree
): Record<string, Tree> => {
  const [, patternTree] = parseExpr()(parseTokens(pattern)[0]);
  return treeMatcher(item, treeExpression(patternTree))[1];
};
