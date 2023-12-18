import { program } from "commander";
import readline from "readline";
import { stdin as input, stdout as output } from "process";
import { Context } from "./types";
import { parseTokens } from "./tokens";
import { evalAccessExpr, evalExpr } from "./evaluator";
import { parseAccessExpression, parseExpr } from "./parser";

program.option("-i, --interactive");

program.parse();

const { interactive } = program.opts();
const [file] = program.args;

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
