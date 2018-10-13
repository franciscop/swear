import magic from './magic';

const wait = time => new Promise(ok => setTimeout(ok, 100));






describe('promises', () => {
  it('can resolve to itself', async () => {
    expect(await magic(true)).toBe(true);
    expect(await magic(3)).toBe(3);
    expect(await magic('a')).toBe('a');
    expect(await magic([])).toEqual([]);
    expect(await magic({})).toEqual({});
  });

  it('can retrieve simple properties', async () => {
    expect(await magic({ c: true }).c).toBe(true);
    expect(await magic({ a: 3 }).a).toBe(3);
    expect(await magic({ b: 'a' }).b).toBe('a');
    expect(await magic({ d: [] }).d).toEqual([]);
    expect(await magic({ e: {} }).e).toEqual({});
  });

  it('can retrieve simple items', async () => {
    expect(await magic([true])[0]).toBe(true);
    expect(await magic([3])[0]).toBe(3);
    expect(await magic(['a'])[0]).toBe('a');
    expect(await magic([[]])[0]).toEqual([]);
    expect(await magic([{}])[0]).toEqual({});
  });

  it('can call a function', async () => {
    expect(await magic([true]).map(a => a)).toEqual([true]);
    expect(await magic([3]).map(a => a)).toEqual([3]);
    expect(await magic(['a']).map(a => a)).toEqual(['a']);
    expect(await magic([[]]).map(a => a)).toEqual([[]]);
    expect(await magic([{}]).map(a => a)).toEqual([{}]);
  });

  it('can chain ad infinitum', async () => {
    expect(await magic([true]).map(a => a).map(a => a).map(a => a)).toEqual([true]);
    expect(await magic([3]).map(a => a).map(a => a).map(a => a)).toEqual([3]);
    expect(await magic(['a']).map(a => a).map(a => a).map(a => a)).toEqual(['a']);
    expect(await magic([[]]).map(a => a).map(a => a).map(a => a)).toEqual([[]]);
    expect(await magic([{}]).map(a => a).map(a => a).map(a => a)).toEqual([{}]);
  });

  it('can retrieve a property after a function', async () => {
    expect(await magic([true]).map(a => a)[0]).toBe(true);
    expect(await magic([3]).map(a => a)[0]).toBe(3);
    expect(await magic(['a']).map(a => a)[0]).toBe('a');
    expect(await magic([[]]).map(a => a)[0]).toEqual([]);
    expect(await magic([{}]).map(a => a)[0]).toEqual({});
  });

  it('cannot call a function response', async () => {
    const message = /You tried to call the non-function/;
    await expect(magic([true]).map(a => a)(a => a)).rejects.toMatchObject({ message });
    await expect(magic([3]).map(a => a)(a => a)).rejects.toMatchObject({ message });
    await expect(magic(['a']).map(a => a)(a => a)).rejects.toMatchObject({ message });
    await expect(magic([[]]).map(a => a)(a => a)).rejects.toMatchObject({ message });
    await expect(magic([{}]).map(a => a)(a => a)).rejects.toMatchObject({ message });
  });

  it('can retrieve nested items', async () => {
    expect(await magic([[true]])[0][0]).toBe(true);
    expect(await magic([[3]])[0][0]).toBe(3);
    expect(await magic([['a']])[0][0]).toBe('a');
    expect(await magic([[[]]])[0][0]).toEqual([]);
    expect(await magic([[{}]])[0][0]).toEqual({});
  });

  it('can call a function after a property', async () => {
    expect(await magic([[true]])[0].map(a => a)).toEqual([true]);
    expect(await magic([[3]])[0].map(a => a)).toEqual([3]);
    expect(await magic([['a']])[0].map(a => a)).toEqual(['a']);
    expect(await magic([[[]]])[0].map(a => a)).toEqual([[]]);
    expect(await magic([[{}]])[0].map(a => a)).toEqual([{}]);
  });

  it('can combine prop => func => prop', async () => {
    expect(await magic([[true]])[0].map(a => a)[0]).toBe(true);
    expect(await magic([[3]])[0].map(a => a)[0]).toBe(3);
    expect(await magic([['a']])[0].map(a => a)[0]).toBe('a');
    expect(await magic([[[]]])[0].map(a => a)[0]).toEqual([]);
    expect(await magic([[{}]])[0].map(a => a)[0]).toEqual({});
  });

  it('resolves typeof as expected', async () => {
    expect(typeof await magic(true)).toBe('boolean');
    expect(typeof await magic(3)).toBe('number');
    expect(typeof await magic('a')).toBe('string');
    expect(typeof await magic([])).toBe('object');
    expect(typeof await magic({})).toBe('object');

    expect(typeof await magic(true) === 'boolean').toBe(true);
    expect(typeof await magic(3) === 'number').toBe(true);
    expect(typeof await magic('a') === 'string').toBe(true);
    expect(typeof await magic([]) === 'object').toBe(true);
    expect(typeof await magic({}) === 'object').toBe(true);
  });

  it('resolves instances as expected', async () => {
    expect(await magic(new Date()) instanceof Date).toBe(true);
    expect((await magic(new Date())) instanceof Date).toBe(true); // same as above
    expect(Array.isArray(await magic([3]))).toBe(true);
  });

  it('can catch a root error', async () => {
    expect(await magic(Promise.reject().catch(err => 'Hello'))).toEqual('Hello');
    expect(await magic(Promise.reject()).catch(err => 'Hello')).toEqual('Hello');
  });

  it('continues the chain after .catch()', async () => {
    expect(await magic(Promise.resolve('abc')).split('')).toEqual(['a', 'b', 'c']);
    expect(await magic(Promise.resolve('abc')).split('')).toEqual(['a', 'b', 'c']);
    expect(await magic(Promise.resolve('abc')).split('')).toEqual(['a', 'b', 'c']);
    expect(await magic(Promise.reject('Hello')).catch(err => err)).toEqual('Hello');
    expect(await magic(Promise.reject('Hello')).catch(err => 'a b')).toEqual('a b');
    expect(typeof magic(Promise.reject('Hello')).catch(err => 'a b').split).toBe('function');
    expect(await magic(Promise.reject()).abc('').catch(err => 'Hello')).toEqual('Hello');
  });

  it('ignores intermediate links in the chain until catch', async () => {
    expect(await magic(Promise.reject(new Error('rejected'))).split('').catch(err => err.message)).toEqual('rejected');
    expect(await magic(Promise.reject(new Error('rejected'))).abcde('').catch(err => err.message)).toEqual('rejected');
    expect(await magic(Promise.reject()).split('').catch(err => 'Hello')).toEqual('Hello');
    expect(await magic(Promise.reject()).abcde('').catch(err => 'Hello')).toEqual('Hello');
  });

  it('skips intermediate values', async () => {
    let err;
    let called = 0;
    try {
      await magic(reject()).split('').map(a => called++);
    } catch (error) {
      err = error;
    }
    expect(err).toMatchObject({ message: /rejected/ });
    expect(called).toEqual(0);
  });

  it('will do its thing even without awaiting', async () => {
    const called = [];

    // Sanity check
    new Promise(ok => called.push('a'));
    await wait(100);
    expect(called).toEqual(['a']);

    magic(['b']).map(it => called.push(it));
    await wait(100);
    expect(called).toEqual(['a', 'b']);
  });
});





describe('numbers', () => {
  it('initializes with a number', async () => {
    expect(await magic(3)).toBe(3);
    expect(await magic(3.3)).toBe(3.3);
  });

  it('can call number methods', async () => {
    expect(await magic(3).toFixed(1)).toBe('3.0');
    expect(await magic(3.33).toFixed(1)).toBe('3.3');
  });

  it('can concatenate to other methods', async () => {
    expect(await magic(3).toFixed(1).split('.')).toEqual(['3','0']);
    expect(await magic(3.33).toFixed(1).split('.')).toEqual(['3','3']);
  });

  it('can perform several operations', async () => {
    expect(await magic(3.1).toFixed(1).split('.').map(n => n * 2).join('.')).toBe('6.2');
  });
});






describe('strings', () => {
  it('initializes with strings', async () => {
    expect(await magic('')).toBe('');
    expect(await magic('Hello')).toBe('Hello');
  });

  it('can perform a single operation', async () => {
    expect(await magic('Hello world').slice(0, 5)).toEqual('Hello');
  });

  it('can transform to other type', async () => {
    expect(await magic('Hello world').split(' ')).toEqual(['Hello', 'world']);
  });
});






describe('arrays', () => {
  it('can do a simple map', async () => {
    expect(await magic([3, 'a']).map(a => a + a)).toEqual([6, 'aa']);
  });

  it('does not perform mutation for pure functions', async () => {
    const a = magic([3, 'a']);
    expect(await a).toEqual([3, 'a']);
    expect(await a.map(a => a + a)).toEqual([6, 'aa']);
    expect(await a).toEqual([3, 'a']);
  });

  it('resolves promises like Promise.all()', async () => {
    const array = ['a', Promise.resolve('b')];
    // expect(await magic(array)).toEqual(['a', 'b']);
    expect(await magic(array).map(a => a)).toEqual(['a', 'b']);
  });

  it('resolves promises like Promise.all() recursively', async () => {
    const array = ['a', Promise.resolve('b'), [Promise.resolve('c')]];
    expect(await magic(array)).toEqual(['a', 'b', ['c']]);
  });

  it('resolves promises like Promise.all() recursively', async () => {
    const array = ['a', Promise.resolve('b'), [Promise.reject('c')]];
    expect(await magic(array).catch(err => err)).toEqual('c');
  });

  it('can do a simple filter', async () => {
    expect(await magic([1, 2, 3]).filter(a => a > 1)).toEqual([2, 3]);
  });

  it('maintains this on filter', async () => {
    expect(await magic([1, 2, 3]).filter(function (a) {
      return a > this;
    }, 1)).toEqual([2, 3]);
    expect(await magic([1, 2, 3]).filter(function (a) {
      return a < this;
    }, 3)).toEqual([1, 2]);
  });

  it('can do a regexp filter', async () => {
    expect(await magic(['a', 'b', 'c']).filter(/(b|c)/)).toEqual(['b', 'c']);
  });

  it('can do an async filter', async () => {
    expect(await magic([1, 2, 3]).filter(async a => a > 1)).toEqual([2, 3]);
  });

  it('maintains this on an async filter', async () => {
    expect(await magic([1, 2, 3]).filter(function (a) {
      return a > this;
    }, 1)).toEqual([2, 3]);
    expect(await magic([1, 2, 3]).filter(function (a) {
      return a < this;
    }, 3)).toEqual([1, 2]);
  });

  it('can do an async filter and chain it', async () => {
    expect(await magic([1, 2, 3]).filter(async a => a > 1).map(async a => a**2)).toEqual([4, 9]);
  });

  it('can do an async filter after chaining it', async () => {
    expect(await magic([1, 2, 3]).map(async a => a**2).filter(async a => a > 1)).toEqual([4, 9]);
  });

  it('has all the right params for filter', async () => {
    expect(await magic([0, 1, 2]).filter(async (a, i, all) => {
      expect(a).toEqual(i);
      expect(all).toEqual([0, 1, 2]);
      return a > 1;
    })).toEqual([2]);
  });
});



describe('objects', () => {
  it('initializes with objects', async () => {
    expect(await magic({})).toEqual({});
    expect(await magic({ a: 3 })).toEqual({ a: 3 });
    expect(await magic({ a: 3, b: 'c' })).toEqual({ a: 3, b: 'c' });
  });

  it('can retrieve nested properties', async () => {
    // console.log(await magic({ a: { b: 'c' } }).a);
    expect(await magic({ a: { b: 'c' } }).a.b).toBe('c');
  });
});






describe.skip('options', () => {

  it('can accept no options', async () => {
    await magic('a');
  });

  it('can accept empty options object', async () => {
    await magic('a', {});
  });

  it('rejects other option types', async () => {
    const errMatch = { message: /invalid options/ };
    await expect(magic('a', 10).map(a => a)).rejects.toMatchObject(errMatch);
  });



  describe('extend', () => {
    const double = function () {
      if (Array.isArray(this)) return this.map(a => a + a);
      return this + this;
    };

    it('can be extended', async () => {
      const opts = { extend: { double } };
      expect(await magic('a', opts).double()).toEqual('aa');
      expect(await magic(['a'], opts).double()).toEqual(['aa']);
    });

    it('can be extended later in the chain', async () => {
      const opts = { extend: { double } };
      expect(await magic('a', opts).slice(0, 1).double()).toEqual('aa');
      expect(await magic(['a'], opts).map(a => a).double()).toEqual(['aa']);
    });

    it('returns the proper instance', async () => {
      const opts = { extend: { double } };
      expect(await magic('a', opts).double().slice(0, 2)).toEqual('aa');
      expect(await magic(['a'], opts).double().map(a => a)).toEqual(['aa']);
    });

    it('can do a complex extension', async () => {
      const extend = {
        abc: function (...args) {
          return Promise.resolve('a' + this.join('') + args.join('') + 'f');
        }
      };
      expect(await magic(['b', 'c'], { extend }).map(a => a).abc('d', 'e')).toBe('abcdef');
    });
  });
});






describe.skip('examples', () => {
  describe('DB library', () => {
    const DB = opts => {
      const users = [
        {id: 0, name: 'Maria', address: { city: 'London' }},
        {id: 1, name: 'John', address: { city: 'London' }}
      ];
      const courses = [];
      const tables = { users, courses };

      const table = function (name) {
        if (!this[name]) throw new Error(`Table ${name} not found`);
        return this[name];
      };
      const find = function (filter) {
        const [key, value] = Object.entries(filter)[0];
        const result = this.find(obj => obj[key] === value);
        if (!result) throw new Error(`Item not found for the filter ${filter}`);
        return this.find(obj => obj[key] === value);
      };
      const extend = { table, find };

      return magic(tables, { extend });
    };

    it('can be initialized', async () => {
      const db = DB();
      const name = await db.table('users').find({ id: 1 }).name;
      expect(name).toEqual('John');

      const city = await db.table('users').find({ id: 1 }).address.city;
      expect(city).toEqual('London');
    });
  });
});
