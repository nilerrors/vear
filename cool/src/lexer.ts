export enum TokenType {
  COMMENT = "COMMENT",

  KEYWORD_LET = "KEYWORD_LET",
  KEYWORD_MUT = "KEYWORD_MUT",
  KEYWORD_DEFER = "KEYWORD_DEFER",
  KEYWORD_FN = "KEYWORD_FN",
  KEYWORD_PUB = "KEYWORD_PUB",
}

type LexerOptions = {
  file?: string | URL;
  test: boolean;
};

class Token {
  type: string;
  value: string;

  constructor(type: string, value: string) {
    this.type = type;
    this.value = value;
  }
}

export class Lexer {
  private pos?: number;
  private file?: string | URL;
  private test: boolean;

  constructor({ file, test }: LexerOptions = {
    test: false,
  }) {
    this.file = file;
    this.test = test;
  }
}
