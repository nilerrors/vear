import { Token, TokenType } from "./token.ts";
import {
  KEYWORDS,
  NUMBERS,
  NUMBERS_WITH_FLOAT,
  OPERATORS,
  TYPES,
} from "./builtin.ts";

type TokenizeError = string;

type TokenizerOptions = {
  source: string | URL;
  from: "file" | "repl";
  mode?: "normal" | "template";
};

export class Tokenizer {
  private fileName: string | URL;
  private from: string;
  private input: string;
  private index: number;
  private currentChar: string | null;
  private tokens: Token[];

  constructor({ source, from }: TokenizerOptions) {
    this.fileName = "<repl>";
    this.input = source as string;
    if (from != "repl") {
      // get file
      this.fileName = source;
      this.input = Deno.readTextFileSync(source).replaceAll(
        "\r\n",
        "\n",
      ) as string;
    }

    this.index = 0;
    this.currentChar = this.input.length > 0 ? this.input[0] : null;
    this.tokens = [];
  }

  private advance(): void {
    this.index++;
    this.currentChar = this.index < this.input.length
      ? this.input[this.index]
      : null;
  }

  // deno-lint-ignore no-explicit-any
  private addToken(type: TokenType, value: any, meta?: any): void {
    const pos = this.findLineColForByte();
    this.tokens.push(
      new Token(
        type,
        value,
        {
          line: {
            num: pos.line,
            value: this.input.split("\n")[pos.line - 1],
          },
          column: pos.col,
          file: this.from == "repl" ? "<repl>" : this.fileName,
        },
        meta,
      ),
    );
  }

  private isEOF(): boolean {
    return this.currentChar === null;
  }

  private findLineColForByte(index?: number): { line: number; col: number } {
    const i = index != undefined ? index : this.index;
    const lines = this.input.split("\n");
    let totalLength = 0;
    let lineStartPos = 0;
    for (let lineNo = 0; lineNo < lines.length; lineNo++) {
      totalLength += lines[lineNo].length + 1; // Because we removed the '\n' during split.
      if (i < totalLength) {
        const colNo = i - lineStartPos;
        return { line: lineNo + 1, col: colNo + 1 };
      }
      lineStartPos = totalLength;
    }
    return { line: lineStartPos, col: 0 };
  }

  private error({
    message,
    extended,
    startPosition,
  }: {
    message: string;
    extended?: string;
    startPosition?: number;
  }): TokenizeError {
    const pos = this.findLineColForByte();
    let errorMessage = `  File ${this.fileName}, line ${pos.line}\n`;
    if (startPosition != undefined) {
      const startPos = this.findLineColForByte(startPosition);
      if (pos.line != startPos.line) {
        errorMessage += this.input.split("\n")[startPos.line - 1];
        errorMessage += "\n";
        errorMessage += "^".padStart(startPos.col - 1, " ");
        errorMessage +=
          "".padStart(this.input.split("\n")[startPos.line - 1].length, "^") +
          "\n";
      } else {
        errorMessage += this.input.split("\n")[pos.line - 1];
        errorMessage += "\n";
        errorMessage += "^".padStart(startPos.col - 1, " ");
        errorMessage += "".padStart(pos.col - startPos.col, "^") + "\n";
      }
    } else {
      errorMessage += "^".padStart(pos.col, " ") + "\n";
    }

    errorMessage += message;
    errorMessage += extended ?? "";
    return errorMessage;

    // return `error at ${this.fileName} ${pos.line}:${pos.col} -> ${message}${
    //   extended != undefined ? "\n\t" : ""
    // }${extended != undefined ? extended : ""}` as TokenizeError;
  }

  public tokenize(): Token[] | TokenizeError {
    if (this.currentChar === null) {
      Deno.exit();
    }
    while (!this.isEOF()) {
      if (this.currentChar === " " || this.currentChar === "\t") {
        this.addToken(TokenType.SPACING, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "\n") {
        this.addToken(TokenType.NEWLINE, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "#") {
        let value = "";
        while (!this.isEOF() && this.currentChar !== "\n") {
          value += this.currentChar;
          this.advance();
        }
        this.addToken(TokenType.COMMENT, value.trim());
        continue;
      }

      if (this.currentChar === "{") {
        this.addToken(TokenType.LBRACE, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "}") {
        this.addToken(TokenType.RBRACE, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "(") {
        this.addToken(TokenType.LPAREN, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === ")") {
        this.addToken(TokenType.RPAREN, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "[") {
        this.addToken(TokenType.LBRACKET, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "]") {
        this.addToken(TokenType.RBRACKET, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "=") {
        if (this.input[this.index + 1] === "=") {
          this.addToken(TokenType.OPERATOR, "==");
          this.advance();
          this.advance();
          continue;
        } else if (this.input[this.index + 1] === ">") {
          this.addToken(TokenType.ARROW, "=>");
          this.advance();
          this.advance();
          continue;
        }
        this.addToken(TokenType.OPERATOR, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === ":") {
        if (this.input[this.index + 1] === "=") {
          this.addToken(TokenType.OPERATOR, ":=");
          this.advance();
          this.advance();
          continue;
        }
        this.addToken(TokenType.COLON, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === ".") {
        this.addToken(TokenType.DOT, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === ",") {
        this.addToken(TokenType.COMMA, this.currentChar);
        this.advance();
        continue;
      }

      if (OPERATORS.includes(this.currentChar)) {
        if (this.currentChar === "-" && this.input[this.index + 1] === ">") {
          this.addToken(TokenType.ARROW, "->");
          this.advance();
          this.advance();
          continue;
        }
        if (this.currentChar === ">" && this.input[this.index + 1] === "=") {
          this.addToken(TokenType.OPERATOR, ">=");
          this.advance();
          this.advance();
          continue;
        }
        if (this.currentChar === "<" && this.input[this.index + 1] === "=") {
          this.addToken(TokenType.OPERATOR, "<=");
          this.advance();
          this.advance();
          continue;
        }
        if (this.currentChar === "<" && this.input[this.index + 1] === "-") {
          this.addToken(TokenType.ARROW, "<-");
          this.advance();
          this.advance();
          continue;
        }
        this.addToken(TokenType.OPERATOR, this.currentChar);
        this.advance();
        continue;
      }

      if (this.currentChar === "'") {
        let value = "";
        this.advance();
        while (
          !this.isEOF() && this.currentChar !== "'" && this.currentChar !== "\n"
        ) {
          value += this.currentChar;
          this.advance();
        }
        if (this.isEOF() || this.currentChar === "\n") {
          return this.error({
            message: "Syntax Error: unterminated string literal",
            startPosition: this.index - value.length,
          });
        }
        this.advance();
        this.addToken(TokenType.STRING, value);
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
          return this.error({
            message: "Syntax Error: unterminated template literal",
          });
        }
        this.advance();
        this.addToken(TokenType.TEMPLATE_LITERAL, value);
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
        this.addToken(
          KEYWORDS.includes(value as typeof KEYWORDS[number])
            ? TokenType.KEYWORD
            : TYPES.includes(value as typeof TYPES[number])
            ? TokenType.TYPE
            : TokenType.IDENTIFIER,
          value,
        );
        continue;
      }

      if (
        NUMBERS_WITH_FLOAT.includes(
          this.currentChar as typeof NUMBERS_WITH_FLOAT[number],
        )
      ) {
        let value = "";
        while (
          !this.isEOF() && this.currentChar &&
          NUMBERS_WITH_FLOAT.includes(
            this.currentChar as typeof NUMBERS_WITH_FLOAT[number],
          )
        ) {
          value += this.currentChar;
          this.advance();
        }
        if (
          value.split("").filter((v) => NUMBERS.includes(v)).toString() == ""
        ) {
          return this.error({
            message: "Syntax Error: invalid syntax",
            startPosition: this.index - value.length,
          });
        }
        if (value.includes(".")) {
          this.addToken(TokenType.FLOAT, value);
        } else {
          this.addToken(TokenType.INTEGER, value);
        }
        continue;
      }

      return this.error({
        message: `Syntax Error: unexpected character '${this.currentChar}'`,
      });
    }

    this.addToken(TokenType.EOF, null);

    return this.tokens;
  }
}
