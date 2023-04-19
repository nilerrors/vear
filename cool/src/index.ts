// deno-lint-ignore-file no-unused-vars
// import { Lexer } from "./lexer.ts";
import { Formatter } from "./format.ts";
import { Parser } from "./parser.ts";
import { Tokenizer } from "./tokenizer.ts";
import { JSTranspiler } from "./transpiler.ts";

function main() {
  const input = `
#this is crazy

use 'math':{
  *
}

enum Direction {
  NORTH
  WEST
  SOUTH
  EAST
}

fn main (this str) str {
  fn name() str {
    fn age() i8 {
      fn hello() str {

      }
    }
  }
  fn hi() str {

  }
}

`;
  // const command = Deno.args[0];
  const file = Deno.args[1];
  const lex = new Tokenizer({ source: input, from: "repl" });
  const tokens = lex.tokenize();
  if (typeof tokens == "string") {
    console.log(tokens);
    Deno.exit();
  }
  const parser = new Parser({ tokens, filename: "<repl>" });
  const ast = parser.parse();
  if (typeof ast == "string") {
    console.log(ast);
    Deno.exit();
  }
  const transpiler = new JSTranspiler(ast);
  // console.log(transpiler.transpile());
  ast.children = ast.children?.filter((t) =>
    !["NEWLINE", "COMMENT", "SPACING"].includes(t.type)
  );
  // console.log(ast);
  const formatter = new Formatter(ast);
  console.log(formatter.format());
  // Deno.writeTextFile("./file.ast.json", JSON.stringify(ast, undefined, 2));
}

main();
