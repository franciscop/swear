// swear (https://github.com/franciscop/swear)
// @author Francisco Presencia (https://francisco.io/) <public@francisco.io>

type SwearCallback<T, R> = (
  item: T,
  index: number,
  arr: readonly T[]
) => R | Promise<R>;

type SwearArrayMethods<T extends readonly any[]> = {
  filter(cb: SwearCallback<T[number], boolean>): Swear<Array<T[number]>>;
  find(cb: SwearCallback<T[number], boolean>): Swear<T[number] | undefined>;
  findIndex(cb: SwearCallback<T[number], boolean>): Swear<number>;
  forEach(cb: SwearCallback<T[number], any>): Swear<Array<T[number]>>;
  every(cb: SwearCallback<T[number], boolean>): Swear<boolean>;
  some(cb: SwearCallback<T[number], boolean>): Swear<boolean>;
  reduce<U = T[number]>(
    cb: (acc: U, item: T[number], index: number, arr: readonly T[number][]) => U | Promise<U>,
    initial?: U
  ): Swear<U>;
  reduceRight<U = T[number]>(
    cb: (acc: U, item: T[number], index: number, arr: readonly T[number][]) => U | Promise<U>,
    initial?: U
  ): Swear<U>;
};

type SwearProps<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? (...args: A) => Swear<Awaited<R>>
    : Swear<T[K]>;
};

export type Swear<T, M extends Record<string, any> = {}> = Promise<T> &
  (T extends readonly any[]
    ? SwearArrayMethods<T> & SwearProps<T>
    : SwearProps<T>) &
  M;

export type SwearOptions<M extends Record<string, any> = {}> = M & {
  number?: Record<string, (value: number, ...args: any[]) => any>;
  string?: Record<string, (value: string, ...args: any[]) => any>;
  array?: Record<string, (value: any[], ...args: any[]) => any>;
};

// Resolve a bit recursively
const resolve = async (value: any): Promise<any> => {
  value = await value;
  if (Array.isArray(value)) {
    return await Promise.all(value.map(resolve));
  }
  return value;
};

const rejected = (message: string) => Promise.reject(new Error(message));

const regexpCallback = (cb: any) => (cb instanceof RegExp ? cb.test.bind(cb) : cb);
const callback = (cb: any, self?: any) => (...args: any[]) =>
  regexpCallback(cb).call(self, ...args);
const extend = (cb: any, self?: any) => async (value: any, i: number, all: any[]) => ({
  value,
  extra: await callback(cb, self)(value, i, all),
});
const extraUp = ({ extra }: { extra: any }) => extra;
const valueUp = ({ value }: { value: any }) => value;

const extendArray: Record<string, (obj: any[], cb: any, self?: any) => Promise<any>> = {
  every: async (obj, cb, self) => {
    for (let i = 0; i < obj.length; i++) {
      const found = await callback(cb, self)(obj[i], i, obj);
      if (!found) return false;
    }
    return true;
  },

  filter: async (obj, cb, self) => {
    const data = await resolve(obj.map(extend(cb, self)));
    return data.filter(extraUp).map(valueUp);
  },

  find: async (obj, cb, self) => {
    for (let i = 0; i < obj.length; i++) {
      const found = await callback(cb, self)(obj[i], i, obj);
      if (found) return obj[i];
    }
  },

  findIndex: async (obj, cb, self) => {
    for (let i = 0; i < obj.length; i++) {
      const found = await callback(cb, self)(obj[i], i, obj);
      if (found) return i;
    }
    return -1;
  },

  forEach: async (obj, cb, self) => {
    await resolve(obj.map(extend(cb, self)));
    return obj;
  },

  // SKIP .map(), since it's the default that happens already

  reduce: async (obj, cb, init) => {
    const hasInit = typeof init !== "undefined";
    if (!hasInit) init = obj[0];
    for (let i = hasInit ? 0 : 1; i < obj.length; i++) {
      init = await callback(cb)(init, obj[i], i, obj);
    }
    return init;
  },

  reduceRight: async (obj, cb, init) => {
    const hasInit = typeof init !== "undefined";
    if (!hasInit) init = obj[obj.length - 1];
    for (let i = obj.length - (hasInit ? 1 : 2); i >= 0; i--) {
      init = await callback(cb)(init, obj[i], i, obj);
    }
    return init;
  },

  some: async (obj, cb, self) => {
    for (let i = 0; i < obj.length; i++) {
      const found = await callback(cb, self)(obj[i], i, obj);
      if (found) return true;
    }
    return false;
  },
};

const getter = (obj: any, ext: any) => (_target: any, key: any) => {
  if (key === "then")
    return (...args: any[]) => resolve(obj).then(...(args as [any]));

  if (key === "catch")
    return (...args: any[]) => swear(resolve(obj).catch(...(args as [any])));

  return func(
    resolve(obj).then((obj: any) => {
      if (typeof key === "symbol") return obj[key];

      if (key in ext) {
        return func((...args: any[]) => ext[key](obj, ...args), ext);
      }

      if (typeof obj === "number" && key in ext.number) {
        return func((...args: any[]) => ext.number[key](obj, ...args), ext);
      }

      if (typeof obj === "string" && key in ext.string) {
        return func((...args: any[]) => ext.string[key](obj, ...args), ext);
      }

      if (Array.isArray(obj) && key in ext.array) {
        return func((...args: any[]) => ext.array[key](obj, ...args), ext);
      }

      if (obj[key] && obj[key].bind) {
        return func(obj[key].bind(obj), ext);
      }

      return func(obj[key], ext);
    }),
    ext
  );
};

const applier = (obj: any, ext: any) => (_target: any, _self: any, args: any[]) => {
  return func(
    resolve(obj).then((obj: any) => {
      if (typeof obj !== "function") {
        return rejected(
          `You tried to call the non-function "${JSON.stringify(obj)}" (${typeof obj}).`
        );
      }
      return obj(...args);
    }),
    ext
  );
};

const func = (obj: any, ext: any): any =>
  new Proxy(() => {}, {
    get: getter(obj, ext),
    apply: applier(obj, ext),
  });

function swear<T extends (...args: any[]) => any, M extends Record<string, any> = {}>(
  fn: T,
  options?: SwearOptions<M>
): (...args: Parameters<T>) => Swear<Awaited<ReturnType<T>>, M>;

function swear<T, M extends Record<string, any> = {}>(
  value: T,
  options?: SwearOptions<M>
): Swear<Awaited<T>, M>;

function swear<R>(fn: (...args: any[]) => any, options?: SwearOptions<any>): R;

function swear<R>(value: any, options?: SwearOptions<any>): R;

function swear(obj: any, { number, string, array, ...others }: SwearOptions = {}): any {
  if (typeof obj === "function") {
    return (...args: any[]) =>
      swear(Promise.all(args).then((args) => obj(...args)), {
        number,
        string,
        array,
        ...others,
      });
  }
  return new Proxy(
    {},
    {
      get: getter(obj, {
        number: { ...number },
        string: { ...string },
        array: { ...extendArray, ...array },
        ...others,
      }),
    }
  );
}

export default swear;
