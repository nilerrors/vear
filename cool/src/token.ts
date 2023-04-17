import { KEYWORDS } from "./builtin.ts";

export type TokenType =
  | "SPACING"
  | "NEWLINE"
  | "COMMENT"
  | "IDENTIFIER"
  | "KEYWORD"
  | "TYPE"
  | "FLOAT"
  | "INTEGER"
  | "STRING"
  | "TEMPLATE_LITERAL"
  | "ASSIGN"
  | "COLON"
  | "COMMA"
  | "LPAREN"
  | "RPAREN"
  | "LBRACE"
  | "RBRACE"
  | "LBRACKET"
  | "RBRACKET"
  | "ARROW"
  | "OPERATOR"
  | "DOT"
  | "EOF";

export class Token {
  constructor(
    public type: TokenType,
    // deno-lint-ignore no-explicit-any
    public value: typeof KEYWORDS[number] | any,
    public line: {
      num: number;
      value: string;
    },
    public column: number,
    // deno-lint-ignore no-explicit-any
    public meta?: any,
  ) {}
}
