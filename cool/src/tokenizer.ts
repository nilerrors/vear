import { Token } from "./token.ts";
import { KEYWORDS } from "./builtin.ts";

type TokenizerOptions = {
  source: string | URL;
  from: "file" | "repl";
};

export class Tokenizer {
  private input: string;
  private index: number;
  private currentChar: string | null;
  private tokens: Token[];

  constructor(input: string) {
    this.input = input;
    this.index = 0;
    this.currentChar = input.length > 0 ? input[0] : null;
    this.tokens = [];
  }

  private advance(): void {
    this.index++;
    this.currentChar = this.index < this.input.length
      ? this.input[this.index]
      : null;
  }

  private addToken(type: string, value: string | null): void {
    this.tokens.push(new Token(type, value));
  }

  private isEOF(): boolean {
    return this.currentChar === null;
  }

  public tokenize(): Token[] | Error {
    if (this.currentChar === null) {
      return new Error("");
    }
    while (!this.isEOF()) {
      if (this.currentChar === " " || this.currentChar === "\t") {
        this.advance();
        continue;
      }

      if (this.currentChar === "\n") {
        this.advance();
        continue;
      }

      if (this.currentChar === "#") {
        let value = "";
        while (!this.isEOF() && this.currentChar !== "\n") {
          value += this.currentChar;
          this.advance();
        }
        this.addToken("COMMENT", value.trim());
        continue;
      }

      if (this.currentChar === "{") {
        this.addToken("LBRACE", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "}") {
        this.addToken("RBRACE", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "(") {
        this.addToken("LPAREN", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === ")") {
        this.addToken("RPAREN", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "[") {
        this.addToken("LBRACKET", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "]") {
        this.addToken("RBRACKET", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "=") {
        this.addToken("EQUALS", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === ":") {
        this.addToken("COLON", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === ",") {
        this.addToken("COMMA", this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "-") {
        if (this.input[this.index + 1] === ">") {
          this.addToken("ARROW", "->");
          this.advance();
          this.advance();
          continue;
        } else {
          return new Error(`Unexpected character: ${this.currentChar}`);
        }
      }

      if (this.currentChar === "'") {
        let value = "";
        this.advance();
        while (!this.isEOF() && this.currentChar !== "'") {
          value += this.currentChar;
          this.advance();
        }
        if (this.isEOF()) {
          return new Error("Unterminated string literal");
        }
        this.advance();
        this.addToken("STRING", value);
        continue;
      }

      if (this.currentChar === '"') {
        let value = "";
        this.advance();
        while (!this.isEOF() && this.currentChar !== '"') {
          value += this.currentChar;
          this.advance();
        }
        if (this.isEOF()) {
          return new Error("Unterminated template literal");
        }
        this.advance();
        this.addToken("TEMPLATE_LITERAL", value);
        continue;
      }

      if (this.currentChar.match(/[a-zA-Z_]/)) {
        let value = "";
        while (
          !this.isEOF() && this.currentChar &&
          this.currentChar.match(/[a-zA-Z0-9_]/)
        ) {
          value += this.currentChar;
          this.advance();
        }

        this.addToken("IDENTIFIER", value);
        continue;
      }

      if (this.currentChar.match(/[0-9]/)) {
        let value = "";
        while (
          !this.isEOF() && this.currentChar && this.currentChar.match(/[0-9.]/)
        ) {
          value += this.currentChar;
          this.advance();
        }
        if (value.includes(".")) {
          this.addToken("FLOAT", value);
        } else {
          this.addToken("INTEGER", value);
        }
        continue;
      }

      return new Error(`Unexpected character: ${this.currentChar}`);
    }

    this.addToken("EOF", null);

    return this.tokens;
  }
}
