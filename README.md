# 🙏 Swear [![npm install swear](https://img.shields.io/badge/npm%20install-swear-blue.svg)](https://www.npmjs.com/package/swear)  [![test badge](https://github.com/franciscop/swear/workflows/tests/badge.svg)](https://github.com/franciscop/swear/blob/master/.github/workflows/tests.yml) [![gzip size](https://img.badgesize.io/franciscop/swear/master/index.min.js.svg?compression=gzip)](https://github.com/franciscop/swear/blob/master/index.min.js)

Flexible promise handling with Javascript:

```js
import swear from "swear";

const name = await swear(fetch("/some.json")).json().user.name;
console.log(name);  // Francisco

const error = await swear(readFile("./error.log", "utf-8")).split("\n").pop();
console.log(error);  // *latest error log message*
```

Features:

- Extends **native Promises**; you can treat them as promises with `await`, `.then()` and `.catch()`.
- Automatic **Promise.all()** for arrays.
- **Chainable** interface that allows for a scripting syntax like jQuery.
- Extends the **API of the Promise value** so it's intuitive to follow.
- Can transparently wrap an async function to make it use swear().
- Full **TypeScript** support with recursive generic types.

See how `swear()` compares to native promises when you have some async operations:

```js
// Using this library
const value = await swear(data).map(op1).filter(op2).map(op3);

// NATIVE; the pure-javascript way of dealing with the same is a lot longer
const value = await Promise.all(data.map(op1)).then(files => files.filter(op2)).then(files => Promise.all(files.map(op3)));

// NATIVE; even when we try to make it more readable it is still longer:
let value = await Promise.all(data.map(op1));
value = value.filter(op2);
value = await Promise.all(value.map(op3));
```

Note that in the example above, `op2` has to be sync since the native `.filter()` cannot deal with an async one, but with `swear()` you can do `.filter(async item => {...})` as well! Keep reading 😄



## API

The coolest bit is that _you already know the API_ since it uses the native Javascript one! You can call the methods, properties, etc. of the value that you pass to swear() as you would do normally:

```js
import swear from "swear";

// No need for swear in this example, but isn't it cool?
const value = await swear(getPi()).toFixed(1).split(".").map(n => n * 2).join(".");
console.log(value); // 6.2 (string)

const name = await swear(fetch("/some.json")).json().user.name;
console.log(name); // Francisco

// Native code (extra verbose for clarity)
const res = await fetch("/some.json");
const data = await res.json();
const user = data.user;
const name = user.name;
console.log(name);
```



### Number

The [**Number documentation**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) explains the native API that is available. For instance, let's see with `.toFixed()`:

```js
import swear from "swear";

async function getPi() { /* ... */ }

const pi = await swear(getPi()).toFixed(2);
console.log(pi);  // 3.14
```

You can apply other string operations as well, for instance you might want to extract some decimals:

```js
const decimals = await swear(getPi()).toFixed(3).split(".").pop();
console.log(decimals);
```



### String

The [**String documentation**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) explains the native API that is available. For instance, let's see with `.split()`:

```js
import swear from "swear";

async function getCsv(url) { /* ... */ }

const first = await swear(getCsv("/some.csv")).split("\n").shift().split(",");
console.log(first);  // [a,1,6,z]
```



### Function

If you pass a function, swear will return a function that, when called, will return a swear instance. It transparently passes the arguments (resolving them if needed!) and resolves with the returned value:

```js
import swear from "swear";

const getSomeInfo = swear(async (file) => {
  const res = await fetch(file);
  return res.json();
});

const names = await getSomeInfo("users.json").map(user => user.name).join(",");
```

This is great if you want to write a library with swear; it will behave the same as the async version when treated like such; but has a lot of new useful functionality from the underlying values.



### Array

We are **extending** native arrays by adding **async** and **RegExp** methods to them:

```js
import swear from "swear";

// It allows the .filter() callback to return a promise
const evens = await swear([0, 1, 2]).filter(async n => n * 2 < 2);
console.log(evens); // [0, 1]

// It also accepts a Regular Expression for an array of strings
const found = await swear(["a", "b", "C"]).find(/c/i);
console.log(found); // "C"
```

> Note: don't worry, we are not touching the prototype. These extensions are *only available* until you call `await`, `.then()` or `.catch()`.

For sync methods they behave the same way as the native counterparts. For `async` methods you need to be aware whether each of those callbacks is called in parallel (concurrent) or in series:

- `.every()`: **series**, _"executes the provided callback function once for each element present in the array until it finds one where callback returns a falsy value"_ - [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every#Description).
- `.filter()`: parallel
- `.find()`: **series**
- `.findIndex()`: **series**
- `.forEach()`: parallel
- `.map()`: parallel
- `.reduce()`: **series**
- `.reduceRight()`: **series**
- `.some()`: **series**, _"executes the callback function once for each element present in the array until it finds one where callback returns a truthy value"_ - [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some#Description).
- `.sort()`: **none**. This method is not modified and it does not accept an async callback.

The ones called in series is because later iterations might depend on previous ones.



## TypeScript

Swear is written in TypeScript and ships with full type definitions. The return type of `swear()` is `Swear<T>`, which extends `Promise<T>` and recursively maps all properties and methods of `T` into swear-wrapped equivalents, so the chain stays typed end to end:

```ts
import swear, { type Swear } from "swear";

// Property chains are fully typed
const name: string = await swear({ user: { name: "Alice" } }).user.name;

// Method chains carry their return types
const parts: string[] = await swear("hello world").split(" ");

// Async array methods accept sync or async callbacks
const evens: number[] = await swear([1, 2, 3, 4]).filter(async n => n % 2 === 0);
```

The `Swear<T>` type is exported if you need to annotate your own functions:

```ts
import swear, { type Swear } from "swear";

function getUsers(): Swear<{ id: number; name: string }[]> {
  return swear(fetch("/api/users").then(r => r.json()));
}

const names = await getUsers().map(u => u.name);
```

You can extend swear with custom methods using the `SwearOptions` type:

```ts
import swear, { type SwearOptions } from "swear";

const opts: SwearOptions<{ double: (v: string) => string }> = {
  double: (v) => v + v,
};

const result = await (swear("hi", opts) as any).double();
console.log(result); // "hihi"
```



## Examples

This library is specially useful if we want to do things like fetching urls, mapping their arrays, working with strings, etc. For instance, let's read all the files in the current directory:

```js
import swear from "swear";
import { readdir, readFile } from "node:fs/promises";

// You can apply `.map()` straight to the output of swear()
const files = await swear(readdir(import.meta.dirname)).map(file => readFile(file, "utf-8"));

// NATIVE; this is how you'd have to do with vanilla JS
const names = await readdir(import.meta.dirname);
const contents = await Promise.all(names.map(file => readFile(file, "utf-8")));
```

Retrieve a bunch of websites with valid responses:

```js
import swear from "swear";

const urls = ["francisco.io", "serverjs.io", "umbrellajs.com"];
const websites = await swear(urls)
  .map(url => fetch(url))       // Fetch the URLs in parallel like Promise.all()
  .map(res => res.text())       // Retrieve the actual bodies
  .filter(Boolean);             // Only those bodies with content

// NATIVE; How to do this with traditional Promises + arrays
const responses = await Promise.all(urls.map(url => fetch(url)));
const websites = (await Promise.all(responses.map(res => res.text()))).filter(Boolean);
```

Works with any value that a promise can resolve to:

```js
import swear from "swear";

// Get and parse a CSV file. Promise => text => array => number
const sum = await swear(fetch("example.com/data.csv").then(r => r.text()))
  .split("\n")
  .filter(Boolean)
  .map(line => line.split("\t").shift())
  .map(num => parseFloat(num))
  .reduce((total, num) => total + num, 0);
```



## Acknowledgements

Libraries based on this:

- [`atocha`](https://npmjs.com/package/atocha): run terminal commands from Node.js.
- [`create-static-web`](https://npmjs.com/package/create-static-web): another static site generator.
- [`fch`](https://www.npmjs.com/package/fch): an improved version of fetch().
- [`files`](https://npmjs.com/package/files): Node.js filesystem API easily usable with Promises and arrays.
