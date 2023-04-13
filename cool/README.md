# cool

cool is a statically typed general-purpose multi-paradigm programming language.

## Features

The language contains features, like, conditionals, functions, generators,
classes, generics, ...

It also auto returns non-mutate statement ina function or generator.

### -> syntax

`<a> -> <b>` is a shorthand for `a {b}`. This only works for one `<b>`
statement, and not a set of `<b>` statements.

e.g.

```
name := 'Sabawoon'

if name == 'Newton' -> writeln('You are a genius')
# or
if name == 'Newton' {
  writeln('You are a genius')
}
```

### Conditionals

```cool
let int n;

# if statements
if n == 0 -> writeln('You have nothing')
elif n == 1 -> writeln('You have 1 thing')
else -> writeln("You have {n} things")

# match statement
match n {
  0 -> writeln('You have nothing')
  1 -> writeln('You have 1 thing')
  _ -> writeln("You have {n} things")
}
```

### Functions

```cool
fn int fib(int n) {
  # auto returns the value of match
  # or any value that stands alone
  # or in ()
    # () is tuple
    # tuple with length one is value itself
  match n {
    in (0, 1) -> n
    _ -> (fib(n - 1) + fib(n - 2))
  }
}

# explicit return
fn int fib(int n) {
  val := match n {
    in (0, 1) -> n
    _ -> fib(n - 1) + fib(n - 2)
  }
  return val
}
```

### Classes

```cool
class Parent {
  str name
  int age
  __init(str name, int age) {
    self.name = name
    self.age = age
  }
  
  __str() {
    "{self.name} is a parent"
  }
}

class Child : Parent {
  __str() {
    "{self.name} is a child"
  }
}
```

### Generators

```cool
```

### Generics

```cool
```
