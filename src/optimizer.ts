import { parseExpr } from "./parser.js";
import { treeCost, treeExpression } from "./tree.js";
import { parseTokens } from "./tokens.js";
import { printTree, type Tree } from "./utils";
import { CostTable } from "./types.js";

export const iterate =
  <T>(f: (x: T) => T, maxIterations = Infinity) =>
  (item: T): [T, boolean] => {
    let i = 0;
    let next = f(item);
    while (JSON.stringify(item) !== JSON.stringify(next)) {
      if (i >= maxIterations) {
        break;
      }
      item = next;
      next = f(item);
      i++;
    }
    // console.log(3, i, f.toString().slice(0, 100));
    // console.log(3, i, printTree(next));

    return [next, i === 0];
  };

export const iterateAll = <T>(...fns: ((x: T) => [T, boolean])[]) =>
  iterate<T>((item) => fns.reduce((acc, fn) => fn(acc)[0], item));

export const rebalanceStep =
  (costTable: CostTable) =>
  (item: Tree): Tree => {
    // console.log(0, printTree(item));

    if (item.children && item.children.length > 0) {
      item.children = item.children.map((child) => {
        // console.log(1, printTree(child));

        const x = rebalanceStep(costTable)(child);
        // console.log(2, printTree(x));

        return x;
      });
    }

    const getCost = (item: Tree): number => treeCost(item, costTable);
    if (patternMatcher("_ + (_ - _)", item)) {
      const [a, { children: [b, c] = [] }] = item.children!;
      const canBalance = getCost(a) < getCost(item.children![1]);

      if (canBalance)
        return {
          name: "-",
          children: [{ name: "+", children: [a, b] }, c],
        };
    }

    if (patternMatcher("_ - (_ + _)", item)) {
      const [a, { children: [b, c] = [] }] = item.children!;
      const canBalance = getCost(a) < getCost(item.children![1]);

      if (canBalance)
        return {
          name: "-",
          children: [{ name: "-", children: [a, b] }, c],
        };
    }

    if (patternMatcher("_ - (_ - _)", item)) {
      const [a, { children: [b, c] = [] }] = item.children!;
      const canBalance = getCost(a) < getCost(item.children![1]);

      if (canBalance)
        return {
          name: "+",
          children: [{ name: "-", children: [a, b] }, c],
        };
    }

    if (
      patternMatcher("_ + (_ + _)", item) ||
      patternMatcher("_ * (_ * _)", item)
    ) {
      const [a, { name, children: [b, c] = [] }] = item.children!;
      const canBalance = getCost(a) < getCost(item.children![1]);

      if (canBalance)
        return {
          name: item.name,
          children: [{ name, children: [a, b] }, c],
        };
    }

    if (patternMatcher("_ / (_ * _)", item)) {
      const [a, { children: [b, c] = [] }] = item.children!;
      const canBalance = getCost(a) < getCost(item.children![1]);

      if (canBalance)
        return {
          name: "/",
          children: [{ name: "/", children: [a, b] }, c],
        };
    }

    if (
      patternMatcher("(_ + _) + _", item) ||
      patternMatcher("(_ * _) * _", item)
    ) {
      const [{ name, children: [a, b] = [] }, c] = item.children!;
      const canBalance = getCost(item.children![0]) > getCost(c);

      if (canBalance)
        return {
          name,
          children: [a, { name: item.name, children: [b, c] }],
        };
    }

    if (patternMatcher("(_ - _) - _", item)) {
      const [{ name, children: [a, b] = [] }, c] = item.children!;
      const canBalance = getCost(item.children![0]) > getCost(c);

      if (canBalance)
        return {
          name,
          children: [a, { name: "+", children: [b, c] }],
        };
    }

    if (patternMatcher("(_ - _) + _", item)) {
      const [{ name, children: [a, b] = [] }, c] = item.children!;
      const canBalance = getCost(item.children![0]) > getCost(c);

      if (canBalance)
        return {
          name,
          children: [a, { name: "-", children: [b, c] }],
        };
    }

    if (patternMatcher("(_ + _) - _", item)) {
      const [{ name, children: [a, b] = [] }, c] = item.children!;
      const canBalance = getCost(item.children![0]) > getCost(c);

      if (canBalance)
        return {
          name,
          children: [a, { name: "-", children: [b, c] }],
        };
    }

    if (patternMatcher("(_ / _) / _", item)) {
      const [{ children: [a, b] = [] }, c] = item.children!;
      const canBalance = getCost(item.children![0]) > getCost(c);

      if (canBalance)
        return {
          name: "/",
          children: [a, { name: "*", children: [b, c] }],
        };
    }

    // console.log(1, printTree(item));
    return item;
  };

export const simplifyStep = (item: Tree): Tree => {
  // const [, patternTree] = parseExpr()(parseTokens("_+(-_)")[0]);

  // console.dir(
  //   {
  //     item,
  //     pat: patternMatcher("_+(-_)", item),
  //     patTree: treeExpression(patternTree),
  //   },
  //   { depth: null }
  // );
  // console.dir({ i: 1, item }, { depth: null });
  // console.log(0, printTree(item));

  if (item.children && item.children.length > 0) {
    item = { ...item, children: item.children.map(simplifyStep) };
  }

  if (patternMatcher("-(-_)", item)) {
    const [{ children: [a] = [] }] = item.children!;
    return a;
  }

  if (patternMatcher("_-(-_)", item)) {
    const [a, { children: [b] = [] }] = item.children!;
    return { name: "+", children: [a, b] };
  }

  if (patternMatcher("_+(-_)", item)) {
    const [a, { children: [b] = [] }] = item.children!;
    return { name: "-", children: [a, b] };
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
    return { name: "0", type: "num" };
  }

  if (
    patternMatcher("_ / _", item) &&
    treeMatcher(item.children![0], item.children![1])[0]
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

  return item;
};

export const sortByCostStep =
  (costTable: CostTable) =>
  (item: Tree): Tree => {
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
      const [{ children: [a, b] = [] }, c] = item.children!;
      if (getCost(b) > getCost(c))
        return {
          name: "/",
          children: [{ name: "-", children: [a, c] }, b],
        };
    }

    if (patternMatcher("(_ / _) / _", item)) {
      const [{ children: [a, b] = [] }, c] = item.children!;
      if (getCost(b) > getCost(c))
        return {
          name: "/",
          children: [{ name: "/", children: [a, c] }, b],
        };
    }

    if (item.children && item.children.length > 0) {
      item.children = item.children.map(sortByCostStep(costTable));
    }

    return item;
  };

export const distributeStep = (item: Tree): Tree => {
  if (patternMatcher("_ * (_ + _)", item)) {
    const [a, { children: [b, c] = [] }] = item.children!;
    return {
      name: "+",
      children: [
        { name: "*", children: [a, b] },
        { name: "*", children: [a, c] },
      ],
    };
  }

  if (patternMatcher("(_ + _) * _", item)) {
    const [{ children: [a, b] = [] }, c] = item.children!;
    return {
      name: "+",
      children: [
        { name: "*", children: [a, c] },
        { name: "*", children: [b, c] },
      ],
    };
  }

  if (patternMatcher("_ * (_ - _)", item)) {
    const [a, { children: [b, c] = [] }] = item.children!;
    return {
      name: "-",
      children: [
        { name: "*", children: [a, b] },
        { name: "*", children: [a, c] },
      ],
    };
  }

  if (patternMatcher("(_ - _) * _", item)) {
    const [{ children: [a, b] = [] }, c] = item.children!;
    return {
      name: "-",
      children: [
        { name: "*", children: [a, c] },
        { name: "*", children: [b, c] },
      ],
    };
  }

  if (patternMatcher("(_ - _) / _", item)) {
    const [{ children: [a, b] = [] }, c] = item.children!;
    return {
      name: "-",
      children: [
        { name: "/", children: [a, c] },
        { name: "/", children: [b, c] },
      ],
    };
  }

  if (patternMatcher("(_ + _) / _", item)) {
    const [{ children: [a, b] = [] }, c] = item.children!;
    return {
      name: "+",
      children: [
        { name: "/", children: [a, c] },
        { name: "/", children: [b, c] },
      ],
    };
  }

  if (item.children && item.children.length > 0) {
    item.children = item.children.map(distributeStep);
  }

  return item;
};

export const factorizeStep = (item: Tree): Tree => {
  if (patternMatcher("(_/_) + (_/_)", item)) {
    const [{ children: [a, b] = [] }, { children: [c, d] = [] }] =
      item.children!;
    if (JSON.stringify(b) === JSON.stringify(d)) {
      return {
        name: "/",
        children: [{ name: "+", children: [a, c] }, b],
      };
    }
  }

  if (patternMatcher("(_/_) - (_/_)", item)) {
    const [{ children: [a, b] = [] }, { children: [c, d] = [] }] =
      item.children!;
    if (JSON.stringify(b) === JSON.stringify(d)) {
      return {
        name: "/",
        children: [{ name: "-", children: [a, c] }, b],
      };
    }
  }

  if (patternMatcher("(_*_) - (_*_)", item)) {
    const [{ children: [a, b] = [] }, { children: [c, d] = [] }] =
      item.children!;
    if (JSON.stringify(b) === JSON.stringify(d)) {
      return {
        name: "*",
        children: [{ name: "-", children: [a, c] }, b],
      };
    }
    if (JSON.stringify(a) === JSON.stringify(d)) {
      return {
        name: "*",
        children: [{ name: "-", children: [b, c] }, a],
      };
    }
    if (JSON.stringify(b) === JSON.stringify(c)) {
      return {
        name: "*",
        children: [{ name: "-", children: [a, d] }, b],
      };
    }
    if (JSON.stringify(a) === JSON.stringify(c)) {
      return {
        name: "*",
        children: [{ name: "-", children: [b, d] }, c],
      };
    }
  }

  if (patternMatcher("(_*_) + (_*_)", item)) {
    const [{ children: [a, b] = [] }, { children: [c, d] = [] }] =
      item.children!;
    if (JSON.stringify(b) === JSON.stringify(d)) {
      return {
        name: "*",
        children: [{ name: "+", children: [a, c] }, b],
      };
    }
    if (JSON.stringify(a) === JSON.stringify(d)) {
      return {
        name: "*",
        children: [{ name: "+", children: [b, c] }, a],
      };
    }
    if (JSON.stringify(b) === JSON.stringify(c)) {
      return {
        name: "*",
        children: [{ name: "+", children: [a, d] }, b],
      };
    }
    if (JSON.stringify(a) === JSON.stringify(c)) {
      return {
        name: "*",
        children: [{ name: "+", children: [b, d] }, c],
      };
    }
  }

  if (item.children && item.children.length > 0) {
    item.children = item.children.map(factorizeStep);
  }

  return item;
};

export const rebalance = (costTable: CostTable = {}) =>
  iterate(rebalanceStep(costTable));

export const simplify = iterate(simplifyStep);

export const sortByCost = (costTable: CostTable = {}) =>
  iterate(sortByCostStep(costTable));

export const distribute = iterate(distributeStep);

export const factorize = iterate(factorizeStep);

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

  return treeMatcher(item, treeExpression(patternTree))[0];
};

const patternMatcherDict = (
  pattern: string,
  item: Tree
): Record<string, Tree> => {
  const [, patternTree] = parseExpr()(parseTokens(pattern)[0]);
  return treeMatcher(item, treeExpression(patternTree))[1];
};
