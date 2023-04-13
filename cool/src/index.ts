// import { Lexer } from "./lexer.ts";
import { Tokenizer } from "./tokenizer.ts";

async function main() {
  const input = `
# This is a comment
struct Person {
  name: str
  age: i16
  city: str
}


fn main() {
  let person1 = {
    name: 'John'
    age: 30
    city: 'New York'
  }

  let person2 = {
    name: 'Doe'
    age: 31
    city: 'LA'
  }

  writeln("Person1 and Person2 combined are {person1.age + person2.age} years old")
}


`;
  const lex = new Tokenizer(input);
  console.log(lex.tokenize());
}

await main();
