import { parseExpr } from "./parser";
import { parseTokens } from "./tokens";
import type {
  Boolean,
  Expression,
  Pow,
  Prefix,
  Product,
  Sum,
  Token,
  Value,
} from "./types";
import type { Tree } from "./utils";

export const treeToken = (item: Token): Tree => {
  return { name: item.src };
};

// export const treeAccessExpression = (item: AccessExpression): Tree => {
//   return item
//     .map((item) => {
//       if (item.type === "name") return item.item;
//       return `\\(${stringifyExpression(item.item)})`;
//     })
//     .join(".");
// };

export const treeExpression = (item: Expression): Tree => {
  return treeSum(item);
};

export const treeBoolean = (item: Boolean): Tree => {
  const [head, rest] = item;
  if (rest.length === 0) return treeSum(head);
  const headTree = treeSum(head);
  const restTree = rest.map((item) => ({
    ...treeSum(item.item),
    name: item.type,
  }));
  return { name: "boolean", children: [headTree, ...restTree] };
};
export const treeSum = (item: Sum): Tree => {
  const [head, rest] = item;
  const headTree = treeProduct(head);
  const restTree = rest.reduce(
    (acc, item) => ({
      children: [acc, treeProduct(item.item)],
      name: item.type,
    }),
    headTree
  );
  return restTree;
};
export const treeProduct = (item: Product): Tree => {
  const [head, rest] = item;
  const headTree = treePow(head);
  const restTree = rest.reduce(
    (acc, item) => ({
      children: [acc, treePow(item.item)],
      name: item.type,
    }),
    headTree
  );
  return restTree;
};
export const treePow = (item: Pow): Tree => {
  const [head, rest] = item;
  const headTree = treePrefix(head);
  const restTree = rest.reduce(
    (acc, item) => ({
      children: [treePrefix(item.item), acc],
      name: item.type,
    }),
    headTree
  );
  return restTree;
};
export const treePrefix = (item: Prefix): Tree => {
  const [value, operator] = item;
  const valueTree = treeValue(value);
  if (operator.length > 0) {
    return operator.reduce(
      (acc, item) => ({ children: [acc], name: item }),
      valueTree
    );
  }
  return valueTree;
};
export const treeValue = (item: Value): Tree => {
  if (item.type === "bool") return { name: item.item.toString(), type: "bool" };
  if (item.type === "num") return { name: item.item.toString(), type: "num" };
  if (item.type === "str") return { name: `"${item.item}"`, type: "str" };
  // if (item.type === "name") return stringifyAccessExpression(item.item);
  if (item.type === "name") return { name: item.item, type: "name" };
  if (item.type === "fn")
    return {
      name: item.item[0],
      children: item.item[1].map(treeExpression),
      type: "fn",
    };
  return treeExpression(item.item);
};

export const treeCost = (
  item: Tree,
  costTable: Record<string, number> = {}
): number => {
  if (!item.children) return 1;
  if (item.children.length === 0) return 1;

  const name = item.name;
  const cost = costTable[name] || 1;
  return (
    cost +
    item.children.reduce((acc, item) => acc + treeCost(item, costTable), 0)
  );
};

export const treeExprFromString = (src: string): Tree => {
  const [tokens, _errors] = parseTokens(src);
  const [, tree] = parseExpr()(tokens);
  return treeExpression(tree);
};
export const stringFromTree = (tree: Tree) => {
  if (tree.type === "fn" && tree.children) {
    return tree.name + "(" + tree.children.map(stringFromTree).join(", ") + ")";
  }
  if (!tree.children) return tree.name;
  if (tree.children.length === 0) return tree.name;
  if (tree.name === "neg" && tree.children.length === 1)
    return "-" + stringFromTree(tree.children[0]);
  if (tree.children.length === 2) {
    const left =
      tree.children[0].children && tree.children[0].type !== "fn"
        ? `(${stringFromTree(tree.children[0])})`
        : stringFromTree(tree.children[0]);
    const right =
      tree.children[1].children && tree.children[1].type !== "fn"
        ? `(${stringFromTree(tree.children[1])})`
        : stringFromTree(tree.children[1]);
    // const left = stringFromTree(tree.children[0]);
    // const right = stringFromTree(tree.children[1]);
    return `${left} ${tree.name} ${right}`;
  }

  return tree.name + "(" + tree.children.map(stringFromTree).join(", ") + ")";
};
