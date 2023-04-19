import { KEYWORDS } from "./builtin.ts";

export enum TokenType {
  SPACING = "SPACING",
  NEWLINE = "NEWLINE",
  COMMENT = "COMMENT",
  IDENTIFIER = "IDENTIFIER",
  KEYWORD = "KEYWORD",
  TYPE = "TYPE",
  FLOAT = "FLOAT",
  INTEGER = "INTEGER",
  STRING = "STRING",
  TEMPLATE_LITERAL = "TEMPLATE_LITERAL",
  ASSIGN = "ASSIGN",
  COLON = "COLON",
  COMMA = "COMMA",
  LPAREN = "LPAREN",
  RPAREN = "RPAREN",
  LBRACE = "LBRACE",
  RBRACE = "RBRACE",
  LBRACKET = "LBRACKET",
  RBRACKET = "RBRACKET",
  ARROW = "ARROW",
  OPERATOR = "OPERATOR",
  DOT = "DOT",
  EOF = "EOF",
}

export class Token {
  constructor(
    public type: TokenType,
    // deno-lint-ignore no-explicit-any
    public value: typeof KEYWORDS[number] | any,
    public at: {
      line: {
        num: number;
        value: string;
      };
      column: number;
      file?: string | URL;
    },
    // deno-lint-ignore no-explicit-any
    public meta?: any,
  ) {}
}
