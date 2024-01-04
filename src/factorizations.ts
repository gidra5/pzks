import { patternMatcher, patternMatcherDict } from "./optimizer";
import { Tree, isEqual } from "./utils";

export function* generateAllFactorizations(item: Tree): Generator<Tree, any, undefined> {
  let unprocessedTree: Tree = item;

  while (true) {
    yield unprocessedTree;
    const tree = factorizeStep(unprocessedTree);

    if (isEqual(unprocessedTree, tree)) break;
    unprocessedTree = tree;
  }
}

export const factorizeStep = (item: Tree): Tree => {
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

  if (item.children && item.children.length > 0) {
    item = { ...item, children: item.children.map(factorizeStep) };
  }

  return item;
};
