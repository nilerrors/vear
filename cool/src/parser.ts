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

import { KEYWORDS } from "./builtin.ts";
import { Token, TokenType } from "./token.ts";
import { Tokenizer } from "./tokenizer.ts";

type ParserError = string;

type ParserOptions = {
  tokens: Token[];
  filename?: string | URL;
};

export type ASTNode = {
  type: string;
  value?: any;
  meta?: any;
  children?: ASTNode[];
};

export class Parser {
  private filename: string | URL;
  private tokens: Token[];
  private currentToken: Token;
  private index: number;
  private ast: ASTNode;

  constructor({ tokens, filename }: ParserOptions) {
    this.filename = filename ?? "<repl>";
    this.tokens = tokens;
    this.currentToken = tokens[0];
    this.index = 0;
    this.ast = {
      type: "Program",
      value: {
        source: this.filename,
      },
      children: [],
    };
  }

  private advance(to = -1): void {
    if (to === -1) {
      this.index++;
    } else this.index = to;
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

  private peek(
    times = 1,
    exclude = ["EOF", "COMMENT", "SPACING"],
  ): { token: Token; index: number } | undefined {
    let index: number = this.index;
    const allowed_tokens = this.tokens.filter((t, i) => {
      index = (!exclude.includes(t.type) && i >= this.index - 1 + times)
        ? i
        : index;
      return (!exclude.includes(t.type) && i >= this.index - 1 + times);
    });
    if (allowed_tokens.length > 0) {
      return { token: allowed_tokens[0], index };
    }
  }

  private skipSpacing() {
    while (this.currentToken.type == "SPACING") {
      this.advance();
    }
  }

  private skipNewlines() {
    while (this.currentToken.type == "NEWLINE") {
      this.advance();
    }
  }

  private error(message: string): ParserError {
    let errorMessage =
      `Error at file ${this.filename}, line ${this.currentToken.line.num}\n`;
    errorMessage += this.currentToken.line.value + "\n";
    errorMessage += "^".padStart(this.currentToken.column - 1, " ") + "\n";
    errorMessage += message;
    return errorMessage;
  }

  private parseComment(): ASTNode {
    const node: ASTNode = {
      type: "Comment",
      value: {
        token: this.currentToken,
      },
    };
    this.consume("COMMENT");
    return node;
  }

  private parseInclude(): ASTNode | ParserError {
    const node: ASTNode = {
      type: "Import",
      value: {
        token: this.currentToken,
      },
    };
    this.consume("KEYWORD");
    this.skipSpacing();
    const from_string = this.peek();
    if (from_string == undefined) {
      return this.error("how the hell");
    }
    if (from_string.token.type == "STRING") {
      this.consume("STRING");
      node.value.from = from_string;
      this.skipSpacing();
      if (this.peek()?.token.type == "COLON") {
        // specified includes
        this.consume("COLON");
        this.skipSpacing();
        if (this.peek()?.token.type != "LBRACE") {
          return this.error("Syntax Error: invalid syntax");
        }
        this.consume("LBRACE");
        while (this.currentToken.type != "RBRACE") {
          this.skipSpacing();
          this.skipNewlines();
          if (
            this.currentToken.type == "OPERATOR" &&
            this.currentToken.value == "*"
          ) {
            if (node.value.includes.length > 0) {
              return this.error("Syntax Error: invalid syntax");
            }
            node.value.includes = {
              everything: true,
            };
            this.consume("OPERATOR");
            break;
          }
          if (this.currentToken.type == "IDENTIFIER") {
            if (node.value.includes == undefined) {
              node.value.includes = [];
            }
            node.value.includes.push(this.currentToken.value);
            this.consume("IDENTIFIER");
          }
        }
        this.consume("RBRACE");
        // return this.error("specified includes not implemented yet");
      }
    }

    return node;
  }

  private parseVariableDeclarationAssignment(): ASTNode | ParserError {
    return this.error("variables not implemented");
  }

  private parseKeyword(): ASTNode | ParserError {
    switch (this.currentToken.value as typeof KEYWORDS[number]) {
      case "use":
        return this.parseInclude();
      case "let":
        return this.parseVariableDeclarationAssignment();
    }
    return this.error(`unexpected keyword name: ${this.currentToken.value}`);
  }

  private parseSpacing(): ASTNode | ParserError {
    if (!["NEWLINE", "SPACING"].includes(this.currentToken.type)) {
      return this.error(`unexpected spacing: ${this.currentToken.value}`);
    }
    const node: ASTNode = {
      type: this.currentToken.type == "NEWLINE" ? "Newline" : "Spacing",
      value: this.currentToken,
    };
    this.consume(this.currentToken.type);
    return node;
  }

  private parseExpression(): ASTNode | ParserError | undefined {
    switch (this.currentToken.type) {
      case "NEWLINE":
      case "SPACING":
        return this.parseSpacing();
      case "COMMENT":
        return this.parseComment();
      case "KEYWORD":
        return this.parseKeyword();
    }

    return this.error(`unexpected token: ${this.currentToken.type}`);
  }

  public parse(): ASTNode | ParserError {
    while (this.index < this.tokens.length && this.currentToken.type != "EOF") {
      const expression = this.parseExpression();
      if (!expression) continue;
      if (typeof expression === "string") {
        return expression;
      }
      this.ast?.children?.push(expression);
    }
    return this.ast;
  }
}
