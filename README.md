# 🙏 Swear [![npm install swear](https://img.shields.io/badge/npm%20install-swear-blue.svg)](https://www.npmjs.com/package/swear)  [![test badge](https://github.com/franciscop/swear/workflows/tests/badge.svg)](https://github.com/franciscop/swear/blob/master/.github/workflows/tests.yml) [![gzip size](https://img.badgesize.io/franciscop/swear/master/index.min.js.svg?compression=gzip)](https://github.com/franciscop/swear/blob/master/index.min.js)

Flexible promise handling with Javascript:

```js
const name = await swear(fetch('/some.json')).json().user.name;
console.log(name);  // Francisco

const error = await swear(readFile('./error.log')).split('\n').pop();
console.log(error);  // *latest error log message*
```

Features:

- Extends **native Promises**; you can treat them as promises with `await`, `.then()` and `.catch()`.
- Automatic **Promise.all()** for arrays.
- **Chainable** interface that allows for a scripting syntax like jQuery.
- Extends the **API of the Promise value** so it's intuitive to follow.
- Can transparently wrap an async function to make it use swear().

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
// No need for swear in this example, but isn't it cool?
const value = await swear(getPi()).toFixed(1).split('.').map(n => n * 2).join('.');
console.log(value); // 6.2 (string)

const name = await swear(fetch('/some.json')).json().user.name;
console.log(name); // Francisco

// Native code (extra verbose for clarity)
const res = await fetch('/some.json');
const data = await res.json();
const user = data.user;
const name = user.name;
console.log(name);
```



### Number

The [**Number documentation**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) explains the native API that is available. For instance, let's see with `.toFixed()`:

```js
// You could use `uwork` to do this in true parallel https://github.com/franciscop/uwork
async function getPi() { /* ... */ }

const pi = await swear(getPi()).toFixed(2);
console.log(pi);  // 3.14
```

You can apply then other string operations as well, for instance you might want to extract some decimals:

```js
const decimals = await swear(getPi()).toFixed(3).split('.').pop();
console.log(decimals);
```



### String

The [**String documentation**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) explains the native API that is available. For instance, let's see with `.split()`:

```js
// Use fetch() or whatever internally
async function getCsv(url) { /* ... */ }

const first = await swear(getCsv('/some.csv')).split('\n').shift().split(',');
console.log(first);  // [a,1,6,z]
```



### Function

If you pass a function, swear will return a function that, when called, will return a swear instance. It transparently passes the arguments (resolving them if needed!) and resolves with the returned value:

```js
const getSomeInfo = swear(async () => {
  ...
});

const names = getSomeInfo('users.json').map(user => user.name).join(',');
```

This is great if you want to write a library with swear; it will behave the same as the async version when treated like such; but has a lot of new useful functionality from the underlying values.



### Array

We are **extending** native arrays by adding **async** and **RegExp** methods to them:

```js
// It allows the .filter() callback to return a promise
const value = await swear([0, 1, 2]).filter(async n => n * 2 < 2);
console.log(value); // [0, 1]

// It also accepts a Regular Expression for an array of strings
const value = await swear(['a', 'b', 'C']).find(/c/i);
console.log(value); // 'C'
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



## Examples

> Note: all these must be run in an `async` context. I am using the great libraries `mz/fs` and `got`.

This library is specially useful if we want to do things like fetching urls, mapping their arrays, working with strings, etc. For instance, let's read all the files in the current directory:

```js
// You can apply `.map()` straight to the output of swear()
const files = await swear(readdir(__dirname)).map(file => readFile(file, 'utf-8'));

// NATIVE; this is how you'd have to do with vanilla JS
const files = await readdir(__dirname).then(files => files.map(file => readFile(file, 'utf-8')));

// PRO-TIP; using my library `files`, based on swear, it gets better:
const files = await dir(__dirname).map(read);
```

Retrieve a bunch of websites with valid responses:

```js
// Retrieve the content of several pages
const urls = ['francisco.io', 'serverjs.io', 'umbrellajs.com'];
const websites = await swear(urls)
  .map(url => got(url))  // Fetch the URLs in parallel like Promise.all()
  .map(res => res.body)  // Retrieve the actual bodies
  .filter(Boolean);      // Only those bodies with content

// NATIVE; How to do this with traditional Promises + arrays
const urls = ['francisco.io', 'serverjs.io', 'umbrellajs.com'];
const responses = await Promise.all(urls.map(url => got(url))); // Fetch the URLs in parallel
const websites = responses
  .map(res => res.body)     // Retrieve the actual bodies
  .filter(Boolean);         // Only those bodies with content
```

Works with any value that a promise can resolve to:

```js
// Get and parse a CSV file. Promise => text => array => number
const sum = await swear(got('example.com/data.csv'))
  .split('\n')
  .filter(Boolean)
  .map(line => line.split('\t').shift())
  .map(num => parseFloat(num, 10))
  .reduce((total, num) => total + num, 0);
```

Calculate pi in true parallel with [Monte Carlo Method](https://en.wikipedia.org/wiki/Monte_Carlo_method) and [`uwork`](https://github.com/franciscop/uwork):

```js
// Create the piece of work to be performed
const getPi = uwork(function findPi(number = 10000) {
  let inside = 0;
  for (let i = 0; i < number; i++) {
    // Not a good random method http://www.playchilla.com/random-direction-in-2d
    let x = Math.random(), y = Math.random();
    if (x * x + y * y <= 1) inside++;
  }
  return 4 * inside / number;
});

// I got 4 cores, so start 4 simultaneous threads and average them:
const parallel = [getPi(), getPi(), getPi(), getPi()];
const pi = await swear(parallel).reduce((pi, part, i, all) => pi + part / all.length, 0);
```



## TODO

It would be nice to have this API, but it's not planned for now:

```js
// Accept a function as the first argument and creates a new function
const findAll = swear((...args) => {...}).map(a => a * 2);

// When finally called, executes everything above
const all = await findAll(...args);
```



## Acknowledgements

Libraries based on this:

- [`atocha`](https://npmjs.com/package/atocha): run terminal commands from Node.js.
- [`create-static-web`](https://npmjs.com/package/create-static-web): another static site generator.
- [`fch`](https://www.npmjs.com/package/fch): an improved version of fetch().
- [`files`](https://npmjs.com/package/files): Node.js filesystem API easily usable with Promises and arrays.
