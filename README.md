# ✨ Magic Promises

Simplify dealing with promises greatly by deferring operations to the resolved value of a promise in successive steps.

```js
npm install magic-promises
```

The main advantage is syntax sugar, making working with promises a lot more efficient if you use them heavily:

```js
// With a bit of magic()
const value = await magic(data).map(op1).filter(op2).map(op3);

// NATIVE; this is how you'd do the same without magic()
const value = await Promise.all(data.map(op1)).then(files => files.filter(op2)).then(files => files.map(op3));

// NATIVE; this is a more readable alternative, but still longer
let value = await Promise.all(data.map(op1));
value = val1.filter(op2);
value = await val2.map(op3)
```

> Note: all the following examples must be run in an `async` context. I am using the great libraries `mz/fs` and `got`.

Read all the files in the current directory:

```js
// You can apply `.map()` straight to the output of magic()
const files = await magic(readdir('.')).map(file => readFile(file, 'utf-8'));

// NATIVE; this is how you'd have to do with vanilla JS
const files = await readdir('.').then(files => files.map(file => readFile(file, 'utf-8')));
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



Specially useful for library authors. See libraries based on this:

- [`fs-array`](https://npmjs.com/package/fs-array)
