import { program } from "commander";
import readline from "readline";
import { stdin as input, stdout as output } from "process";
import { Context } from "./types.js";
import { parseTokens } from "./tokens.js";
import { evalAccessExpr, evalExpr } from "./evaluator.js";
import { parseAccessExpression, parseExpr } from "./parser.js";
import { printErrors, printTokenErrors, printTree } from "./utils.js";
import { FileMap } from "codespan-napi";
import { treeExpression } from "./tree.js";
import { treeOptimizer } from "./optimizer.js";

program.option("-i, --interactive");

program.parse();

const { interactive } = program.opts();
const [file] = program.args;
let map = new FileMap();
const ctx: Context = {};

if (interactive) {
  const rl = readline.createInterface({ input, output, prompt: ">> " });
  rl.prompt();

  rl.on("line", (_line) => {
    const line = _line.trim();
    switch (line) {
      case "hello":
        console.log("world!");
        break;
      case "exit":
        rl.close();
        break;
      default: {
        const [tokens, tokenErrors] = parseTokens(line);

        const fileName = "cli";
        map.addFile(fileName, line);
        printTokenErrors(tokenErrors, map, fileName);
        const [, tree, exprErrors] = parseExpr()(tokens);
        printErrors(exprErrors, tokens, map, fileName);
        console.log(printTree(treeExpression(tree)));
        console.log(printTree(treeOptimizer(treeExpression(tree))[0]));

        // const x = evalExpr(tree, ctx);
        break;
      }
    }
    rl.prompt();
  }).on("close", () => {
    console.log("Have a great day!");
    process.exit(0);
  });
} else {
}

export const evalAccessStr = (str: string, ctx: Context) =>
  evalAccessExpr(parseAccessExpression(parseTokens(str)[0])[1], ctx);
export const evalExprStr = (str: string, ctx: Context) => {
  return evalExpr(parseExpr()(parseTokens(str)[0])[1], ctx);
};
