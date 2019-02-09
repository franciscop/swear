# 🙏 Swear [![npm install swear](https://img.shields.io/badge/npm%20install-swear-blue.svg)](https://www.npmjs.com/package/swear)  [![status](https://circleci.com/gh/franciscop/swear.svg?style=shield)](https://circleci.com/gh/franciscop/swear) [![gzip size](https://img.badgesize.io/franciscop/swear/master/swear.min.js.svg?compression=gzip)](https://github.com/franciscop/swear/blob/master/swear.min.js)

A better way to deal with Javascript promises:

```js
const name = await swear(fetch('/some.json')).json().user.name;
console.log(name);  // Francisco

const error = await swear(readFile('./error.log')).split('\n').pop();
console.log(error);  // *latest error log message*
```

Features:

- Extends **native Promises**; you can still treat them as normal with `await`, `.then()` and `.catch()`.
- Automatic **Promise.all()** for arrays of promises.
- **Chainable** interface that allows scripting syntax like jQuery.
- Uses the **API of the JS object** so it's intuitive to follow.
- Extends **Array functions** to make them async.

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

Note that in the example above, `op2` has to be sync since the native `.filter()` cannot deal with an async one, but with `swear()` you can use async callbacks in `.filter()` as well! Keep reading 😄



## API

The coolest bit is that _you already know the API_ since it uses the native Javascript one! You can call the methods, properties, etc. of the value that you pass to swear() as you would do with native Javascript:

```js
const value = await swear(3.11).toFixed(1).split('.').map(n => n * 2).join('.');
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


### Array

We are **extending** native arrays by adding **async** and **RegExp**:

```js
// It allows the .filter() callback to return a promise
const value = await swear([0, 1, 2]).filter(async n => n * 2 < 2);
console.log(value); // [0, 1]

// It also accepts a raw Regular Expression for an array of strings
const value = await swear(['a', 'b', 'C']).filter(/c/i);
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

The ones called in series is because we might halt the execution of successive iterations if a condition is met, so they can only be fulfilled in series.



### Number

The [**Number documentation**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) explains the native API that is available. For instance, let's see with `.toFixed()`:

```js
// You could use `uwork` to do this in the background https://github.com/franciscop/uwork
async function calculatePi() { /* ... */ }

const pi = await swear(calculatePi()).toFixed(2);
console.log(pi);  // 3.14
```

You can apply then other string operations as well, for instance you might want to extract some decimals:

```js
const decimals = await swear(calculatePi()).toFixed(3).split('.').pop();
console.log(decimals);
```





## Examples

> Note: all these must be run in an `async` context. I am using the great libraries `mz/fs` and `got`.

This library is specially useful if we want to do things like fetching urls, mapping their arrays, working with strings, etc. For instance, let's read all the files in the current directory:

```js
// You can apply `.map()` straight to the output of swear()
const files = await swear(readdir(__dirname)).map(file => readFile(file, 'utf-8'));

// NATIVE; this is how you'd have to do with vanilla JS
const files = await readdir(__dirname).then(files => files.map(file => readFile(file, 'utf-8')));

// PRO; using my library `files`, based on swear, it gets better:
const files = await dir(__dirname).map(read);
```

Retrieve a bunch of websites with valid responses

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



## Acknowledgements

Libraries based on this:

- [`atocha`](https://npmjs.com/package/atocha): run a command in your terminal.
- [`create-static-web`](https://npmjs.com/package/create-static-web) another static site generator.
- [`fch`](https://www.npmjs.com/package/fch): an improved version of fetch().
- [`files`](https://npmjs.com/package/files): Node.js filesystem API easily usable with Promises and arrays.
