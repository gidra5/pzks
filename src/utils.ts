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
export const printTree = (
  { name, children = [] }: Tree,
  levels: boolean[] = []
): string => {
  let x = levels.map(getPrefix).join("") + name;

  const rest = children
    .map((child, i) => printTree(child, [...levels, i === children.length - 1]))
    .join("");
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
