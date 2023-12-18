import { error, indexPosition } from "./constructor";

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

const padding = 1;
const getPrefix = (level: boolean, i: number, levels: boolean[]) => {
  const last = i < levels.length - 1;
  const _padding = Array(padding - 1)
    .fill(last ? " " : "─")
    .join("");
  const prefix = last ? (level ? " " : "│") : level ? "└" : "├";
  return prefix + _padding + " ";
};
export type Tree = { name: string; children?: Tree[] };
export const printTree = (
  { name, children = [] }: Tree,
  levels: boolean[] = []
) => {
  console.log(levels.map(getPrefix).join("") + name);

  children.forEach((child, i) =>
    printTree(child, [...levels, i === children.length - 1])
  );
};

export const endOfTokensError = (index: number) =>
  error("end of tokens", indexPosition(index));
