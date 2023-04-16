export const KEYWORDS = [
  "use",
  "let",
  "mut",
  "fn",
  "true",
  "false",
  "nil",
  "defer",
  "class",
  "self",
  "struct",
  "enum",
  "union",
  "if",
  "elif",
  "else",
  "match",
  "for",
  "return",
  "typeof",
  "del",
] as const;

// built in types
export const TYPES = [
  "str",
  "i8",
  "i16",
  "i32",
  "i64",
  "f32", // decimal
  "f64", // float
  "rune",
] as const;

export const NUMBERS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;

export const NUMBERS_WITH_FLOAT = [
  ".",
  ...NUMBERS,
] as const;

export const OPERATORS = [
  "-",
  "+",
  "*",
  "/",
  "%",
  "^",
  "<",
  ">",
] as const;
