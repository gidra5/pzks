import {
  Diagnostic,
  primaryDiagnosticLabel,
  secondaryDiagnosticLabel,
} from "codespan-napi";
import { error, indexPosition } from "./constructor.js";

export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg ?? "assertion failed");
  }
}

export function* groupBy<
  T extends unknown,
  U extends unknown,
  P extends (tokens: T[], index: number) => [U, number]
>(str: T[], parse: P) {
  let index = 0;

  while (str[index] !== "") {
    const [token, nextIndex] = parse(str, index);
    index = nextIndex;
    yield token;
  }
}

const padding = 2;
const getPrefix = (level: boolean, i: number, levels: boolean[]) => {
  const last = i < levels.length - 1;
  const _padding = Array(padding - 1)
    .fill(last ? " " : "─")
    .join("");
  const prefix = last ? (level ? " " : "│") : level ? "└" : "├";
  return prefix + _padding + " ";
};
export type Tree = { name: string; children?: Tree[]; type?: string };
export const printTree = ({ name, children = [], label }: Tree & { label?: string }, levels: boolean[] = []): string => {
  let x = levels.map(getPrefix).join("") + (label ?? name);

  const rest = children.map((child, i) => printTree(child, [...levels, i === children.length - 1])).join("");
  return x + "\n" + rest;
};

export const endOfTokensError = (index: number) =>
  error("end of tokens", indexPosition(index));

import { TokenPos } from "../src/types.js";

const tokenPosToSrcPos = (tokenPos, tokens: TokenPos[]) => {
  let startTokenIndex = tokenPos.start;
  if (!tokens[startTokenIndex]) {
    startTokenIndex = tokens.length - 1;
  }
  let endTokenIndex = Math.max(tokenPos.end - 1, startTokenIndex);
  if (!tokens[endTokenIndex]) {
    endTokenIndex = tokens.length - 1;
  }

  return {
    start: tokens[startTokenIndex].pos.start,
    end: tokens[endTokenIndex].pos.end,
  };
};

export const printTokenErrors = (errors, map, fileName) => {
  const errorDiagnosticLabel = (error) => {
    if (error.cause.length > 0)
      return error.cause.flatMap(errorDiagnosticLabel);

    const label = secondaryDiagnosticLabel(map.getFileId(fileName), {
      ...error.pos,
      message: error.message,
    });
    return label;
  };
  const errorDiagnostic = (error) => {
    const diagnostic = Diagnostic.error();
    const fileId = map.getFileId(fileName);
    diagnostic.withLabels([
      primaryDiagnosticLabel(fileId, {
        ...error.pos,
        message: error.message,
      }),
      ...error.cause.flatMap(errorDiagnosticLabel),
    ]);
    return diagnostic;
  };
  const errorsDiagnostic = errors.map(errorDiagnostic);
  errorsDiagnostic.forEach((error) => error.emitStd(map));
};

export const printErrors = (errors, tokens, map, fileName) => {
  const errorDiagnosticLabel = (error) => {
    if (error.cause.length > 0)
      return error.cause.flatMap(errorDiagnosticLabel);

    const label = secondaryDiagnosticLabel(map.getFileId(fileName), {
      ...tokenPosToSrcPos(error.pos, tokens),
      message: error.message,
    });
    return label;
  };
  const errorDiagnostic = (error) => {
    const diagnostic = Diagnostic.error();
    const fileId = map.getFileId(fileName);
    diagnostic.withLabels([
      primaryDiagnosticLabel(fileId, {
        ...tokenPosToSrcPos(error.pos, tokens),
        message: error.message,
      }),
      ...error.cause.flatMap(errorDiagnosticLabel),
    ]);
    return diagnostic;
  };
  const errorsDiagnostic = errors.map(errorDiagnostic);
  errorsDiagnostic.forEach((error) => error.emitStd(map));
};

export const isEqual = (a, b) => {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== "object" || typeof b !== "object") return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (Object.keys(a).length !== Object.keys(b).length) return false;
  for (const key in a) {
    if (!(key in b)) return false;
    if (!isEqual(a[key], b[key])) return false;
  }

  return true;
};

export const costs = { "+": 2, "*": 4, "/": 8, "-": 3 };

//1 / (f + (1 - f) / N), де f - частка послідовних обчислень [0, 1], N - число процессорів
export const calcMaxAcceleration = (linearFraction: number, N: number) =>
  N / (linearFraction * (N - 1) + 1);

const treeEdgeCount = (tree: Tree) =>
  tree.children?.reduce(
    (acc, child) => acc + treeEdgeCount(child),
    tree.children.length
  ) ?? 0;
const treeVertexCount = (tree: Tree) =>
  tree.children?.reduce((acc, child) => acc + treeVertexCount(child), 1) ?? 1;

export const calcLinearFraction = (expr: Tree) =>
  treeEdgeCount(expr) / treeVertexCount(expr);

export const cachedIterable = <T>(
  iterable: Iterable<T>
): (() => Iterable<T>) => {
  const cache: T[] | null = !Array.isArray(iterable) ? [] : null;
  return () => {
    if (!cache) return iterable;
    if (cache.length > 0) return cache;
    return (function* () {
      for (const x of iterable) {
        cache.push(x);
        yield x;
      }
    })();
  };
};

export function* product2<T, U>(a: Iterable<T>, b: Iterable<U>) {
  const bCached = cachedIterable(b);
  for (const x of a) {
    for (const y of bCached()) {
      yield [x, y];
    }
  }
}

export function* product3<T, T2, T3>(
  a: Iterable<T>,
  b: Iterable<T2>,
  c: Iterable<T3>
) {
  const bCached = cachedIterable(b);
  const cCached = cachedIterable(c);
  for (const x of a) {
    for (const y of bCached()) {
      for (const z of cCached()) {
        yield [x, y, z];
      }
    }
  }
}

export function* product<T>(...args: Iterable<T>[]) {
  if (args.length === 0) {
    yield [];
    return;
  }
  const [head, ...tail] = args;
  const tailCached = tail.map(cachedIterable);
  for (const x of head) {
    for (const y of product(...tailCached.map((x) => x()))) {
      yield [x, ...y];
    }
  }
}

export function* take<T>(n: number, iterable: Iterable<T>) {
  for (const x of iterable) {
    if (n <= 0) break;
    yield x;
    n--;
  }
}

export function count<T>(iterable: Iterable<T>) {
  let count = 0;
  for (const x of iterable) {
    count++;
  }
  return count;
}
