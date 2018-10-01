// magic-promises (https://github.com/franciscop/magic-promises)
// @author Francisco Presencia (https://francisco.io/) <public@francisco.io>

// Bind it to retrieve the original line
// const log = console.log.bind(global);

// Resolve a bit recursively
const resolve = async value => {
  // log('RESOLVING', value);
  value = await value;
  if (Array.isArray(value)) {
    return await Promise.all(value.map(resolve));
  }
  return value;
};

const reject = message => Promise.reject(new Error(message));



// Extend each of the values of map with the appropriate fn
const regexpCallback = cb => cb instanceof RegExp ? cb.test.bind(cb) : cb;
const extend = (cb, self) => async (value, i, all) => ({
  value,
  extra: await regexpCallback(cb).call(self, value, i, all)
});
const extraUp = ({ extra }) => extra;
const valueUp = ({ value }) => value;



// Array methods - converted to async
const extendArray = {
  // Convert to extended async map, filter on the extra and extract the value
  filter: (obj, cb, self) => resolve(obj.map(extend(cb, self)))
    .then(arr => arr.filter(extraUp).map(valueUp))
};



// For Proxy's { get } trap (property access)
const getter = obj => (target, key) => {
  // log('GETTER', obj, key, typeof key);

  // This expects to return a function, that can resolve to another promise
  // const res = await magic(obj); magic(obj).then(res => {...});
  if (key === 'then') return (...args) => {
    // log('GETTER THEN', obj, ...args);
    // resolve(obj).then(res => log('AAAA', res));
    return resolve(obj).then(...args);
  };

  if (key === 'catch') return (...args) => {
    // log('GETTER CATCH', obj, ...args);
    // if (name === 'catch') return (...args) => play(prom.catch(...args), opts);
    return root(resolve(obj).catch(...args));
  };

  // Wrap it in a resolution so promises are first-class values
  return func(resolve(obj).then(obj => {
    // Some times it will ask for Symbol; just return a low-key value
    if (typeof key === 'symbol') return obj[key];

    // Filter it in an async fashion. As an extra kick, allow for RegExp
    for (let k in extendArray) {
      if (Array.isArray(obj) && key === k) {
        return func((cb, self) => extendArray[k](obj, cb, self));
      }
    }

    // Returns the requested FUNCTION; so we need to bind the context
    // const res = magic(obj).map(item => {...});
    if (obj[key] && obj[key].bind) {
      // log('GETTER FUNCTION', typeof obj, obj, key);
      return func(obj[key].bind(obj));
    }

    // Return the simple property
    // const res = await magic(obj).key;
    // log('GETTER PROPERTY', obj, key);
    return func(obj[key]);
  }));
};



// For Proxy()'s { apply } trap (function call)
const applier = obj => (target, self, args) => {
  // log('APPLIER', obj, args);

  // Wrap it in a resolution so promises are first-class values
  return func(resolve(obj).then(obj => {
    if (typeof obj !== 'function') {
      return reject(`
        You tried to call the non-function "${JSON.stringify(obj)}" (${typeof obj}).
        This can happen in several situations like these:
        - await magic(['a'])();  // <= wrong
        - await magic(['a']).map(a => a)(a => a);  // <= wrong
      `);
    }
    return obj(...args);
  }));
};


// ROOT: it can be called only with a getter like `obj.op1()` or `obj.name`
const root = obj => new Proxy({}, { get: getter(obj) });

// FUNC: it can be called either with a getter or as a function `op1()`, `prop1`
const func = obj => new Proxy(() => {}, { get: getter(obj), apply: applier(obj) });

export default root;
