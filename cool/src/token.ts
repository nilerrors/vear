export type TokenType =
  | "COMMENT"
  | "IDENTIFIER"
  | "KEYWORD"
  | "NUMBER"
  | "STRING"
  | "TEMPLATE_LITERAL"
  | "ASSIGN"
  | "COLON"
  | "COMMA"
  | "LPAREN"
  | "RPAREN"
  | "LBRACE"
  | "RBRACE"
  | "EOF";

export class Token {
  constructor(
    public type: TokenType,
    public value: any,
    // public line: number,
    // public column: number,
  ) {}
}
