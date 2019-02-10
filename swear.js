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
const callback = (cb, self) => (...args) => regexpCallback(cb).call(self, ...args);
const extend = (cb, self) => async (value, i, all) => ({
  value,
  extra: await callback(cb, self)(value, i, all)
});
const extraUp = ({ extra }) => extra;
const valueUp = ({ value }) => value;



// Array methods - converted to async
const extendArray = {
  // Check whether every method returns a truthy value
  every: async (obj, cb, self) => {
    for (let i = 0; i < obj.length; i++) {
      const found = await callback(cb, self)(obj[i], i, obj);
      if (!found) return false;
    }
    return true;
  },

  // Convert to extended async map, filter on the extra and extract the value
  filter: async (obj, cb, self) => {
    // We need to resolve it since it generates an array of promises
    const data = await resolve(obj.map(extend(cb, self)));
    return data.filter(extraUp).map(valueUp);
  },

  // Iterate over the array, one at a time
  find: async (obj, cb, self) => {
    for (let i = 0; i < obj.length; i++) {
      const found = await callback(cb, self)(obj[i], i, obj);
      if (found) return obj[i];
    }
  },

  // Iterate over the array, one at a time
  findIndex: async (obj, cb, self) => {
    for (let i = 0; i < obj.length; i++) {
      const found = await callback(cb, self)(obj[i], i, obj);
      if (found) return i;
    }
    return -1;
  },

  forEach: async (obj, cb, self) => {
    // We need to resolve it since it generates an array of promises
    await resolve(obj.map(extend(cb, self)));
    return obj;
  },

  // SKIP .map(), since it's the default that happens already

  // The init is passed by reference
  reduce: async (obj, cb, init) => {
    const hasInit = typeof init !== 'undefined';
    if (!hasInit) init = obj[0];
    for (let i = hasInit ? 0 : 1; i < obj.length; i++) {
      init = await callback(cb)(init, obj[i], i, obj);
    }
    return init;
  },

  // Same as .reduce(), but from high to low
  // The init is passed by reference
  reduceRight: async (obj, cb, init) => {
    const hasInit = typeof init !== 'undefined';
    if (!hasInit) init = obj[obj.length - 1];
    for (let i = obj.length - (hasInit ? 1 : 2); i >= 0; i--) {
      init = await callback(cb)(init, obj[i], i, obj);
    }
    return init;
  },

  // Check whether every method returns a truthy value
  some: async (obj, cb, self) => {
    for (let i = 0; i < obj.length; i++) {
      const found = await callback(cb, self)(obj[i], i, obj);
      if (found) return true;
    }
    return false;
  }
};



// For Proxy's { get } trap (property access)
const getter = (obj, extend) => (target, key) => {
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
    // if (name === 'catch') return (...args) => play(prom.catch(...args), extend);
    // We need the root() because we want to allow for catch() to continue working
    //   like this: .map().catch().filter(). Without it, we end this bit.
    return root(resolve(obj).catch(...args));
  };

  // Wrap it in a resolution so promises are first-class values
  return func(resolve(obj).then(obj => {
    // Some times it will ask for Symbol; just return a low-key value
    if (typeof key === 'symbol') return obj[key];

    // Allows to extend the number prototype in here
    if (key in extend) {
      return func((...args) => extend[key](obj, ...args), extend);
    }

    // Allows to extend the number prototype in here
    if (typeof obj === 'number' && key in extend.number) {
      return func((...args) => extend.number[key](obj, ...args), extend);
    }

    // Allows to extend the number prototype in here
    if (typeof obj === 'string' && key in extend.string) {
      return func((...args) => extend.string[key](obj, ...args), extend);
    }

    // Filter it in an async fashion. As an extra kick, allow for RegExp
    if (Array.isArray(obj) && key in extend.array) {
      return func((...args) => extend.array[key](obj, ...args), extend);
    }

    // Returns the requested FUNCTION; so we need to bind the context
    // const res = magic(obj).map(item => {...});
    if (obj[key] && obj[key].bind) {
      // log('GETTER FUNCTION', typeof obj, obj, key);
      return func(obj[key].bind(obj), extend);
    }

    // Return the simple property
    // const res = await magic(obj).key;
    // log('GETTER PROPERTY', obj, key);
    return func(obj[key], extend);
  }), extend);
};



// For Proxy()'s { apply } trap (function call)
const applier = (obj, extend) => (target, self, args) => {
  // log('APPLIER', obj, args);

  // Wrap it in a resolution so promises are first-class values
  return func(resolve(obj).then(obj => {
    if (typeof obj !== 'function') {
      return reject(`You tried to call "${JSON.stringify(obj)}" (${typeof obj}) as a function, but it is not.`);
    }
    return obj(...args);
  }), extend);
};

// FUNC: it can be called either with a getter or as a function `op1()`, `prop1`
const func = (obj, extend) => new Proxy(() => {}, {
  get: getter(obj, extend),
  apply: applier(obj, extend)
});

// ROOT: it can be called only with a getter like `obj.op1()` or `obj.name`
const root = (obj, { number, string, array, ...others } = {}) => new Proxy({}, {
  get: getter(obj, {
    number: { ...number },
    string: { ...string },
    array: { ...extendArray, ...array },
    ...others
  })
});

export default root;
