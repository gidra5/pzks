import {
  AccessExpression,
  Boolean,
  Expression,
  Pow,
  Prefix,
  Product,
  Sum,
  Token,
  Value,
} from "./types";
import { Tree } from "./utils";

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
  // return stringifyBoolean(item);
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
  if (rest.length === 0) return treeProduct(head);
  const headTree = treeProduct(head);
  const restTree = rest.map((item) => ({
    ...treeProduct(item.item),
    name: item.type,
  }));
  return { name: "sum", children: [headTree, ...restTree] };
};
export const treeProduct = (item: Product): Tree => {
  const [head, rest] = item;
  if (rest.length === 0) return treePow(head);
  const headTree = treePow(head);
  const restTree = rest.map((item) => ({
    ...treePow(item.item),
    name: item.type,
  }));
  return { name: "product", children: [headTree, ...restTree] };
};
export const treePow = (item: Pow): Tree => {
  const [head, rest] = item;
  if (rest.length === 0) return treePrefix(head);
  const headTree = treePrefix(head);
  const restTree = rest.map((item) => ({
    children: [treePrefix(item.item)],
    name: item.type,
  }));
  return { name: "pow", children: [headTree, ...restTree] };
};
export const treePrefix = (item: Prefix): Tree => {
  const [value, operator] = item;
  const valueStringified = treeValue(value);
  if (operator) return { name: operator.type, children: [valueStringified] };
  return valueStringified;
};
export const treeValue = (item: Value): Tree => {
  if (item.type === "bool") return { name: item.item.toString() };
  if (item.type === "num") return { name: item.item.toString() };
  if (item.type === "str") return { name: `"${item.item}"` };
  // if (item.type === "name") return stringifyAccessExpression(item.item);
  if (item.type === "name") return { name: item.item };
  return { name: "parens", children: [treeExpression(item.item)] };
};
