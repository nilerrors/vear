class Person {
  name;
  age;
  city;
  constructor({ name, age, city }) {
    this.name = name;
    this.age = age;
    this.city = city;
  }
}

function main() {
  const person1 = new Person({ name: "John", age: 30, city: "New York" });
  const person2 = new Person({ name: "Doe", age: 31, city: "LA" });

  if (person1.age > person2.age) {
    console.log("Person1 is older than Person2");
  } else if (person1.age < person2.age) {
    console.log("Person1 is younger than Person2");
  } else {
    console.log("Person1 and Person2 are the same age");
  }

  console.log(
    `Person1 and Person2 combined are ${person1.age + person2.age} years old`,
  );
}

main();
