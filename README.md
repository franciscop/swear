# ✨ Magic Promises [![status](https://circleci.com/gh/franciscop/magic-promises.svg?style=shield)](https://circleci.com/gh/franciscop/magic-promises)

Sintax sugar for dealing with promises in a much simpler way for async-heavy workflows:

```js
npm install magic-promises
```

Builds the promise chain internally, so your code can be used like you would do with sync strings, arrays, etc:

```js
// With a bit of magic()
const value = await magic(data).map(op1).filter(op2).map(op3);

// NATIVE; the pure-javascript way of dealing with the same is a lot longer
const value = await Promise.all(data.map(op1)).then(files => files.filter(op2)).then(files => Promise.all(files.map(op3)));

// NATIVE; even when we try to make it more readable it is still longer:
let value = await Promise.all(data.map(op1));
value = value.filter(op2);
value = await Promise.all(value.map(op3));
```



## API

The coolest bit is that there is no API. You can call the methods, properties, etc of the value that you pass to magic():

```js
const value = await magic(3.1).toFixed(1).split('.').map(n => n * 2).join('.');
console.log(value);
// 6.2 (string)
```



## Examples

> Note: all these must be run in an `async` context. I am using the great libraries `mz/fs` and `got`.

This library is specially useful if we want to do things like fetching urls, mapping their arrays, working with strings, etc. For instance, let's read all the files in the current directory:

```js
// You can apply `.map()` straight to the output of magic()
const files = await magic(readdir(__dirname)).map(file => readFile(file, 'utf-8'));

// NATIVE; this is how you'd have to do with vanilla JS
const files = await readdir(__dirname).then(files => files.map(file => readFile(file, 'utf-8')));

// PRO; using my library `fs-array`, based on magic-promises, it gets better:
const files = await dir(__dirname).map(read);
```

Retrieve a bunch of websites with valid responses

```js
// Retrieve the content of several pages
const urls = ['francisco.io', 'serverjs.io', 'umbrellajs.com'];
const websites = await magic(urls)
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
const sum = await magic(got('example.com/data.csv'))
  .split('\n')
  .filter(Boolean)
  .map(line => line.split('\t').shift())
  .map(num => parseFloat(num, 10))
  .reduce((total, num) => total + num, 0);
```


## Acknowledgements

Libraries based on this:

- [`fs-array`](https://npmjs.com/package/fs-array) (from me).
