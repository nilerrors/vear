// Lexer

// Lexer

class Lexer {
  private text: string;
  private pos: number;
  private currentChar: string | null;

  constructor(text: string) {
    this.text = text;
    this.pos = 0;
    this.currentChar = this.text.length > 0 ? this.text[0] : null;
  }

  public getNextToken(): Token | null {
    while (this.currentChar !== null) {
      if (this.currentChar === ' ') {
        this.advance();
        continue;
      }

      if (this.currentChar.match(/[0-9]/)) {
        return this.number();
      }

      if (this.currentChar === '+') {
        this.advance();
        return new Token('PLUS', '+');
      }

      if (this.currentChar === '-') {
        this.advance();
        return new Token('MINUS', '-');
      }

      if (this.currentChar === '*') {
        this.advance();
        return new Token('MULTIPLY', '*');
      }

      if (this.currentChar === '/') {
        this.advance();
        return new Token('DIVIDE', '/');
      }

      if (this.currentChar === '(') {
        this.advance();
        return new Token('LPAREN', '(');
      }

      if (this.currentChar === ')') {
        this.advance();
        return new Token('RPAREN', ')');
      }

      throw new Error('Invalid character: ' + this.currentChar);
    }

    return null; // Return null when there are no more tokens
  }

  private advance(): void {
    this.pos++;
    this.currentChar = this.pos < this.text.length ? this.text[this.pos] : null;
  }

  private number(): Token {
    let result = '';
    while (this.currentChar !== null && this.currentChar.match(/[0-9]/)) {
      result += this.currentChar;
      this.advance();
    }
    return new Token('NUM', result);
  }
}


// Token

class Token {
  public type: string;
  public value: string;

  constructor(tokenType: string, tokenValue: string) {
    this.type = tokenType;
    this.value = tokenValue;
  }
}
// Parser

class Parser {
  private lexer: Lexer;
  private currentToken: Token | null;

  constructor(lexer: Lexer) {
    this.lexer = lexer;
    this.currentToken = this.lexer.getNextToken();
  }

  public parse(): number {
    const result = this.expr();
    if (this.currentToken !== null) {
      throw new Error('Unexpected token: ' + JSON.stringify(this.currentToken));
    }
    return result;
  }

  private expr(): number {
    let term = this.term();

    while (
      this.currentToken !== null &&
      (this.currentToken.type === 'PLUS' || this.currentToken.type === 'MINUS')
    ) {
      const token = this.currentToken;
      if (token.type === 'PLUS') {
        this.eat('PLUS');
        term += this.term();
      } else if (token.type === 'MINUS') {
        this.eat('MINUS');
        term -= this.term();
      }
    }

    return term;
  }

  private term(): number {
    let factor = this.factor();

    while (
      this.currentToken !== null &&
      (this.currentToken.type === 'MULTIPLY' || this.currentToken.type === 'DIVIDE')
    ) {
      const token = this.currentToken;
      if (token.type === 'MULTIPLY') {
        this.eat('MULTIPLY');
        factor *= this.factor();
      } else if (token.type === 'DIVIDE') {
        this.eat('DIVIDE');
        factor /= this.factor();
      }
    }

    return factor;
  }

  private factor(): number {
    const token = this.currentToken;

    if (token !== null && token.type === 'NUM') {
      this.eat('NUM');
      return parseInt(token.value, 10);
    } else if (token !== null && token.type === 'LPAREN') {
      this.eat('LPAREN');
      const result = this.expr();
      this.eat('RPAREN');
      return result;
    } else {
      throw new Error('Unexpected token: ' + JSON.stringify(token));
    }
  }

  private eat(tokenType: string): void {
    if (this.currentToken !== null && this.currentToken.type === tokenType) {
      this.currentToken = this.lexer.getNextToken();
    } else {
      throw new Error('Unexpected token: ' + JSON.stringify(this.currentToken));
    }
  }
}


// Compiler

class Compiler {
  private lexer: Lexer;
  private parser: Parser;

  constructor(inputString: string) {
    this.lexer = new Lexer(inputString);
    this.parser = new Parser(this.lexer);
  }

  public compile(): string {
    const parsedExpression = this.parser.parse();
    const compiledCode = `console.log(${parsedExpression});`;
    return compiledCode;
  }

  public evaluate(): void {
    const compiledCode = this.compile();
    eval(compiledCode);
  }
}

// Usage

const inputString = "2 + 3 * (4 - 1)";
const compiler = new Compiler(inputString);
const compiledCode = compiler.compile();
console.log("Compiled code:", compiledCode);
console.log("Result:");
compiler.evaluate();
