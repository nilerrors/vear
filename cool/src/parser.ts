import { KEYWORDS } from "./builtin.ts";
import { Token, TokenType } from "./token.ts";
import { Tokenizer } from "./tokenizer.ts";

type ParserError = string;

type ParserOptions = {
  tokens: Token[];
  filename?: string | URL;
};

export enum NodeType {
  PROGRAM = "PROGRAM",
  NEWLINE = "NEWLINE",
  SPACING = "SPACING",
  COMMENT = "COMMENT",
  IMPORT = "IMPORT",
  FN = "FN",
  ENUM = "ENUM",
  ENUM_VAL = "ENUM_VAL",
}

export class ASTNode {
  type: NodeType;
  value?: any;
  meta?: any;
  children?: ASTNode[];

  constructor({ type, value, meta, children }: {
    type: NodeType;
    value?: any;
    meta?: any;
    children?: ASTNode[];
  }) {
    this.type = type;
    this.value = value;
    this.meta = meta;
    this.children = children;
  }
}

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
      type: NodeType.PROGRAM,
      value: {
        source: this.filename,
      },
      children: [],
    };
  }

  private error(
    message: string,
  ): ParserError {
    const startPos = {
      line: this.currentToken.at.line.num,
      column: this.currentToken.at.column - this.currentToken.value.length,
    };
    let errorMessage =
      `Error at file ${this.filename}, line ${this.currentToken.at.line.num}\n`;
    errorMessage += this.currentToken.at.line.value + "\n";
    if (this.currentToken.at.line.num != startPos.line) {
      // handle multiline errors
    } else {
      // console.log(startPos);
      // console.log(this.currentToken);
      errorMessage += "".padStart(startPos.column - 1, " ");
      errorMessage +=
        "".padStart(this.currentToken.at.column - startPos.column, "^") +
        "\n";
    }

    errorMessage += message;
    return errorMessage;
  }

  private advance(to = -1): void {
    if (to === -1) {
      this.index++;
    } else this.index = to;
    this.currentToken = this.tokens[this.index];
  }

  private consume(type: TokenType): Token | ParserError {
    if (this.currentToken.type === type) {
      const token = this.currentToken;
      this.advance();
      return token;
    } else {
      return this.error(
        `Expected ${type} token, but got ${this.currentToken.type} token`,
      );
    }
  }

  private peek(
    times = 1,
    exclude = ["EOF", "COMMENT", NodeType.SPACING],
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

  private skipSpacingNewlines(): number {
    let totalSkipped = 0;
    while (["NEWLINE", NodeType.SPACING].includes(this.currentToken.type)) {
      this.advance();
      totalSkipped++;
    }
    return totalSkipped;
  }

  private skipSpacing() {
    while (this.currentToken.type == TokenType.SPACING) {
      this.advance();
    }
  }

  private skipNewlines() {
    while (this.currentToken.type == TokenType.NEWLINE) {
      this.advance();
    }
  }

  private parseComment(): ASTNode {
    const node: ASTNode = new ASTNode({
      type: NodeType.COMMENT,
      value: {
        token: this.currentToken,
      },
    });
    this.consume(TokenType.COMMENT);
    return node;
  }

  private parseInclude(): ASTNode | ParserError {
    const node: ASTNode = new ASTNode({
      type: NodeType.IMPORT,
      value: {
        token: this.currentToken,
      },
    });
    this.consume(TokenType.KEYWORD);
    this.skipSpacingNewlines();
    const from_string = this.peek();
    if (from_string?.token.type != TokenType.STRING) {
      return this.error(
        `Syntax Error: expected string, got '${from_string?.token.type}'`,
      );
    }
    this.consume(TokenType.STRING);
    node.value.from = {
      from: from_string?.token.value,
      token: from_string?.token,
    };
    this.skipSpacing();
    if (this.peek()?.token.type == TokenType.COLON) {
      // specified includes
      this.consume(TokenType.COLON);
      this.skipSpacing();
      if (this.peek()?.token.type != TokenType.LBRACE) {
        return this.error("Syntax Error: invalid syntax");
      }
      this.consume(TokenType.LBRACE);
      while (this.currentToken.type != TokenType.RBRACE) {
        this.skipSpacingNewlines();
        if (
          this.currentToken.type == TokenType.OPERATOR &&
          this.currentToken.value == "*"
        ) {
          if (node.value.includes && node.value.includes.length > 0) {
            return this.error("Syntax Error: invalid syntax");
          }
          node.value.includes = {
            everything: true,
          };
          this.consume(TokenType.OPERATOR);
          this.skipSpacingNewlines();
          break;
        }
        if (this.currentToken.type != TokenType.IDENTIFIER) {
          return this.error(
            `Syntax Error: expected identifier, got '${this.currentToken.type}'`,
          );
        }
        if (node.value.includes == undefined) {
          node.value.includes = [];
        }
        node.value.includes.push(this.currentToken.value);
        this.consume(TokenType.IDENTIFIER);
        this.skipSpacingNewlines();
      }
      this.consume(TokenType.RBRACE);
      // return this.error("specified includes not implemented yet");
    }

    return node;
  }

  private parseVariableDeclarationAssignment(): ASTNode | ParserError {
    return this.error("variables not implemented");
  }

  private parseEnumDeclaration(): ASTNode | ParserError {
    const node: ASTNode = new ASTNode({
      type: NodeType.ENUM,
    });
    this.consume(TokenType.KEYWORD);
    this.skipSpacingNewlines();
    const enumName = this.peek();
    if (enumName?.token.type != TokenType.IDENTIFIER) {
      return this.error(
        `Syntax Error: expected enum name, got '${enumName?.token.type}'`,
      );
    }
    this.consume(TokenType.IDENTIFIER);
    this.skipSpacingNewlines();
    if (this.peek()?.token.type != TokenType.LBRACE) {
      return this.error(
        `Syntax Error: expected '{', got ${this.currentToken.type}`,
      );
    }
    this.consume(TokenType.LBRACE);
    while (this.currentToken.type != TokenType.RBRACE) {
      this.skipSpacingNewlines();
      const enum_val = this.currentToken;
      if (enum_val.type != TokenType.IDENTIFIER) {
        return this.error(
          `Syntax Error: expected enum value, got '${enum_val.type}'`,
        );
      }
      this.consume(TokenType.IDENTIFIER);
      if (!node.children) {
        node.children = [];
      }
      node.children.push(
        new ASTNode({
          type: NodeType.ENUM_VAL,
          value: {
            name: {
              name: enum_val.value,
              token: enum_val,
            },
          },
        }),
      );
      this.skipSpacingNewlines();
    }
    this.consume(TokenType.RBRACE);
    node.value = {
      name: {
        name: enumName.token.value,
        token: enumName.token,
      },
    };
    return node;
  }

  private parseFunction(): ASTNode | ParserError {
    const node: ASTNode = new ASTNode({
      type: NodeType.FN,
    });

    this.consume(TokenType.KEYWORD);
    this.skipSpacingNewlines();
    const fnName = this.peek();
    if (fnName?.token.type != TokenType.IDENTIFIER) {
      this.advance();
      return this.error(
        `Syntax Error: function name expected, got '${fnName?.token.value}'`,
      );
    }
    this.consume(TokenType.IDENTIFIER);
    node.value = {
      name: {
        name: fnName.token.value,
        token: fnName.token,
      },
    };
    this.skipSpacingNewlines();
    const lParenParameters = this.peek();
    if (lParenParameters?.token.type != TokenType.LPAREN) {
      this.advance();
      return this.error(
        `Syntax Error: expected '(', got '${lParenParameters?.token.value}'`,
      );
    }
    this.consume(TokenType.LPAREN);
    this.skipSpacingNewlines();
    while (this.currentToken.type != TokenType.RPAREN) {
      this.skipSpacingNewlines();
      const parameterName = this.currentToken;
      if (parameterName.type != TokenType.IDENTIFIER) {
        this.advance();
        return this.error(
          `Syntax Error: expected paramater name, got '${parameterName.value}'`,
        );
      }
      if (!node.value.paramaters) node.value.paramaters = [];
      this.consume(TokenType.IDENTIFIER);
      this.skipSpacingNewlines();
      const parameterType = this.currentToken;
      if (
        parameterType.type != TokenType.IDENTIFIER &&
        parameterType.type != TokenType.TYPE
      ) {
        this.advance();
        return this.error(
          `Syntax Error: expected type, got '${parameterType.value}'`,
        );
      }
      this.consume(parameterType.type);

      node.value.paramaters.push({
        name: {
          name: parameterName.value,
          token: parameterName,
        },
        type: {
          name: parameterType.value,
          token: parameterType,
        },
      });
    }
    this.consume(TokenType.RPAREN);
    this.skipSpacingNewlines();
    const fnReturnType = this.peek();
    if (
      fnReturnType?.token.type == TokenType.IDENTIFIER ||
      fnReturnType?.token.type == TokenType.TYPE
    ) {
      this.advance();
      this.consume(fnReturnType.token.type);
      node.value.returnType = {
        type: fnReturnType.token.value,
        token: fnReturnType.token,
      };
    }
    const fnArrow = this.peek();
    if (
      fnArrow?.token.type == TokenType.ARROW && fnArrow?.token.value == "->"
    ) {
      // handle arrowed function
      // auto-returns the one value
      this.advance();
      this.consume(TokenType.ARROW);
      node.children = [];
      node.meta = {
        ended: true,
      };
      return this.error("no yet implemented");
    } else {
      const block = this.parseBlock();
      if (typeof block == "string") {
        return block;
      }
      node.children = block;
    }

    // handle rest of function

    return node;
  }

  private parseKeyword(): ASTNode | ParserError {
    switch (this.currentToken.value as typeof KEYWORDS[number]) {
      case "use":
        return this.parseInclude();
      case "let":
        return this.parseVariableDeclarationAssignment();
      case "fn":
        return this.parseFunction();
      case "enum":
        return this.parseEnumDeclaration();
    }
    return this.error(`unexpected keyword name: ${this.currentToken.value}`);
  }

  private parseSpacing(): ASTNode | ParserError {
    if (
      this.currentToken.type != TokenType.NEWLINE &&
      this.currentToken.type != TokenType.SPACING
    ) {
      return this.error(`unexpected spacing: ${this.currentToken.value}`);
    }
    const node: ASTNode = new ASTNode({
      type: this.currentToken.type == TokenType.NEWLINE
        ? NodeType.NEWLINE
        : NodeType.SPACING,
      value: this.currentToken,
    });
    this.consume(this.currentToken.type);
    return node;
  }

  private parseBlock(): ASTNode[] | ParserError {
    const statements: ASTNode[] = [];
    this.skipSpacingNewlines();
    if (this.currentToken.type != TokenType.LBRACE) {
      this.advance();
    }
    this.consume(TokenType.LBRACE);
    while (this.currentToken.type != TokenType.RBRACE) {
      const statement = this.parseExpression();
      if (!statement) continue;
      if (typeof statement == "string") return statement;
      statements.push(statement);
    }
    this.consume(TokenType.RBRACE);
    return statements;
  }

  private parseExpression(): ASTNode | ParserError | undefined {
    switch (this.currentToken.type) {
      case TokenType.NEWLINE:
      case TokenType.SPACING:
        return this.parseSpacing();
      case TokenType.COMMENT:
        return this.parseComment();
      case TokenType.KEYWORD:
        return this.parseKeyword();
    }

    return this.error(
      `Syntax Error: unexpected token: '${this.currentToken.type}'`,
    );
  }

  public parse(): ASTNode | ParserError {
    while (
      this.index < this.tokens.length && this.currentToken.type != TokenType.EOF
    ) {
      const expression = this.parseExpression();
      if (expression == undefined) continue;
      if (typeof expression === "string") {
        return expression;
      }
      if (!this.ast.children) {
        this.ast.children = [];
      }
      this.ast?.children.push(expression);
    }
    return this.ast;
  }
}
