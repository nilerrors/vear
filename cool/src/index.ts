// import { Lexer } from "./lexer.ts";
import { Parser } from "./parser.ts";
import { Tokenizer } from "./tokenizer.ts";

async function main() {
  const input = `#this is crazy`;
  // const command = Deno.args[0];
  const file = Deno.args[1];
  console.log(Deno.args);
  const lex = new Tokenizer({ source: input, from: "repl" });
  const tokens = lex.tokenize();
  if (typeof tokens == "string") {
    console.log(tokens);
    Deno.exit();
  }
  const parser = new Parser(tokens);
  const ast = parser.parse();
  const transpiler = new JSTranpsiler(ast);
  console.log(transpiler.transpile())
  console.log(ast);
}

await main();
