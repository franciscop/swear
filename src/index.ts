// swear (https://github.com/franciscop/swear)
// @author Francisco Presencia (https://francisco.io/) <public@francisco.io>

type SwearCallback<T, R> = (
  item: T,
  index: number,
  arr: readonly T[],
) => R | Promise<R>;

// Allows RegExp as shorthand callback for string arrays
type SwearCb<T, R> = SwearCallback<T, R> | (T extends string ? RegExp : never);

// Infers element type without noUncheckedIndexedAccess adding `| undefined`
type ElemOf<T extends readonly any[]> = T extends readonly (infer E)[] ? E : never;

type SwearArrayMethods<T extends readonly any[]> = {
  filter(cb: SwearCb<ElemOf<T>, boolean>): Swear<ElemOf<T>[]>;
  find(cb: SwearCb<ElemOf<T>, boolean>): Swear<ElemOf<T> | undefined>;
  findIndex(cb: SwearCb<ElemOf<T>, boolean>): Swear<number>;
  forEach(cb: SwearCallback<ElemOf<T>, any>): Swear<ElemOf<T>[]>;
  every(cb: SwearCb<ElemOf<T>, boolean>): Swear<boolean>;
  map<U>(cb: SwearCallback<any, U>): Swear<U[]>;
  some(cb: SwearCb<ElemOf<T>, boolean>): Swear<boolean>;
  // Two overloads: with initial (U free) and without (U = element type)
  reduce<U>(
    cb: (acc: U, item: ElemOf<T>, index: number, arr: readonly ElemOf<T>[]) => U | Promise<U>,
    initial: U,
  ): Swear<U>;
  reduce(
    cb: (
      acc: ElemOf<T>,
      item: ElemOf<T>,
      index: number,
      arr: readonly ElemOf<T>[],
    ) => ElemOf<T> | Promise<ElemOf<T>>,
  ): Swear<ElemOf<T>>;
  reduceRight<U>(
    cb: (acc: U, item: ElemOf<T>, index: number, arr: readonly ElemOf<T>[]) => U | Promise<U>,
    initial: U,
  ): Swear<U>;
  reduceRight(
    cb: (
      acc: ElemOf<T>,
      item: ElemOf<T>,
      index: number,
      arr: readonly ElemOf<T>[],
    ) => ElemOf<T> | Promise<ElemOf<T>>,
  ): Swear<ElemOf<T>>;
};

// Exclude valueOf/toString to break self-referential cycles that break Awaited<Swear<T>>
// Use any[] for args to avoid losing overloaded method signatures (e.g. String.prototype.split)
type SwearProps<T> = {
  [K in Exclude<keyof T, "valueOf" | "toString">]: T[K] extends (...args: any[]) => infer R
    ? (...args: any[]) => Swear<Awaited<R>>
    : Swear<T[K]>;
};

export type Swear<T, M extends Record<string, any> = {}> = Promise<T> &
  // 0 extends 1 & T is the standard trick to detect `any` — any methods allowed
  (0 extends 1 & T
    ? SwearArrayMethods<any[]> & SwearProps<any>
    : [T] extends [never]
      ? SwearProps<string>
      : T extends (...args: infer A) => infer R
        ? (...args: A) => Swear<Awaited<R>, M>
        : T extends readonly any[]
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

const regexpCallback = (cb: any) =>
  cb instanceof RegExp ? cb.test.bind(cb) : cb;
const callback =
  (cb: any, self?: any) =>
  (...args: any[]) =>
    regexpCallback(cb).call(self, ...args);
const extend =
  (cb: any, self?: any) => async (value: any, i: number, all: any[]) => ({
    value,
    extra: await callback(cb, self)(value, i, all),
  });
const extraUp = ({ extra }: { extra: any }) => extra;
const valueUp = ({ value }: { value: any }) => value;

const extendArray: Record<
  string,
  (obj: any[], cb: any, self?: any) => Promise<any>
> = {
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
    ext,
  );
};

const applier =
  (obj: any, ext: any) => (_target: any, _self: any, args: any[]) => {
    return func(
      resolve(obj).then((obj: any) => {
        if (typeof obj !== "function") {
          return rejected(
            `You tried to call the non-function "${JSON.stringify(obj)}" (${typeof obj}).`,
          );
        }
        return obj(...args);
      }),
      ext,
    );
  };

const func = (obj: any, ext: any): any =>
  new Proxy(() => {}, {
    get: getter(obj, ext),
    apply: applier(obj, ext),
  });

function swear<T, M extends Record<string, any> = {}>(
  value: T,
  options?: SwearOptions<M>,
): Swear<Awaited<T>, M>;

function swear(
  obj: any,
  { number, string, array, ...others }: SwearOptions = {},
): any {
  if (typeof obj === "function") {
    return (...args: any[]) =>
      swear(
        Promise.all(args).then((args) => obj(...args)),
        {
          number,
          string,
          array,
          ...others,
        },
      );
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
    },
  );
}

export default swear;
