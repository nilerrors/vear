import { ASTNode } from "./parser.ts";

export class JSTranspiler {
  private ast: ASTNode;
  constructor(ast: ASTNode) {
    this.ast = ast;
  }

  transpile() {
  }
}
