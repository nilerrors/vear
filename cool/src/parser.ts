/*import { Token } from "./token.ts";

export class Parser {
  private js_code: string;
  private tokens: Token[];
  private index: number;
  private currentToken: Token | null;

  constructor(tokens: Token[]) {
    this.js_code = "";
    this.tokens = tokens;
    this.index = 0;
    this.currentToken = tokens.length > 0 ? tokens[0] : null;
  }

  private advance() {
    this.index++;
  }

  private peek(times?: number) {
    const token = this.tokens[this.index + (times ?? 1)];
    if (token.type == "EOF") return null;
    return token;
  }

  compile(): string {
    if (this.tokens.length == 0 && this.currentToken != null) return "";

    while (this.currentToken != null && this.currentToken.type != "EOF") {
      if (this.currentToken.type == "COMMENT") {
        this.advance();
        continue;
      }
      if (this.currentToken.type == "STRING") {
        this.js_code += `"${this.currentToken.value}"`;
        this.advance();
        continue;
      }
      if (this.currentToken.type == "KEYWORD") {

      }
    }
    return this.js_code;
  }
}
*/

import { Token, TokenType } from "./token.ts";
import { Tokenizer } from "./tokenizer.ts";

export type ASTNode = {
  type: string;
  value?: any;
  meta?: any;
  children?: ASTNode[];
};

export class Parser {
  private tokens: Token[];
  private currentToken: Token;
  private index: number;
  private ast: ASTNode;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.currentToken = tokens[0];
    this.index = 0;
    this.ast = {
      type: "Program",
      children: [],
    };
  }

  private advance(): void {
    this.index++;
    this.currentToken = this.tokens[this.index];
  }

  private consume(type: TokenType): Token {
    if (this.currentToken.type === type) {
      const token = this.currentToken;
      this.advance();
      return token;
    } else {
      throw new Error(
        `Expected ${type} token, but got ${this.currentToken.type} token`,
      );
    }
  }

  private parseComment(): ASTNode {
    const node: ASTNode = {
      type: "Comment",
      value: this.currentToken.value,
    };
    this.consume("COMMENT");
    return node;
  }

  private parseExpression(): ASTNode {
    if (this.currentToken.type === "COMMENT") {
      return this.parseComment();
    }

    throw new Error(`Unexpected token: ${this.currentToken.type}`);
  }

  public parse(): ASTNode {
    while (this.index < this.tokens.length && this.currentToken.type != "EOF") {
      const expression = this.parseExpression();
      this.ast?.children?.push(expression);
    }
    return this.ast;
  }
}
