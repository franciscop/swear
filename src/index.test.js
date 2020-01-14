import swear from ".";

const wait = (time = 10) => new Promise(ok => setTimeout(ok, time));

describe("promises", () => {
  it("can resolve to itself", async () => {
    expect(await swear(true)).toBe(true);
    expect(await swear(3)).toBe(3);
    expect(await swear("a")).toBe("a");
    expect(await swear([])).toEqual([]);
    expect(await swear({})).toEqual({});
  });

  it("can retrieve simple properties", async () => {
    expect(await swear({ c: true }).c).toBe(true);
    expect(await swear({ a: 3 }).a).toBe(3);
    expect(await swear({ b: "a" }).b).toBe("a");
    expect(await swear({ d: [] }).d).toEqual([]);
    expect(await swear({ e: {} }).e).toEqual({});
  });

  it("can retrieve simple items", async () => {
    expect(await swear([true])[0]).toBe(true);
    expect(await swear([3])[0]).toBe(3);
    expect(await swear(["a"])[0]).toBe("a");
    expect(await swear([[]])[0]).toEqual([]);
    expect(await swear([{}])[0]).toEqual({});
  });

  it("can call a function", async () => {
    expect(await swear([true]).map(a => a)).toEqual([true]);
    expect(await swear([3]).map(a => a)).toEqual([3]);
    expect(await swear(["a"]).map(a => a)).toEqual(["a"]);
    expect(await swear([[]]).map(a => a)).toEqual([[]]);
    expect(await swear([{}]).map(a => a)).toEqual([{}]);
  });

  it("can chain ad infinitum", async () => {
    expect(
      await swear([true])
        .map(a => a)
        .map(a => a)
        .map(a => a)
    ).toEqual([true]);
    expect(
      await swear([3])
        .map(a => a)
        .map(a => a)
        .map(a => a)
    ).toEqual([3]);
    expect(
      await swear(["a"])
        .map(a => a)
        .map(a => a)
        .map(a => a)
    ).toEqual(["a"]);
    expect(
      await swear([[]])
        .map(a => a)
        .map(a => a)
        .map(a => a)
    ).toEqual([[]]);
    expect(
      await swear([{}])
        .map(a => a)
        .map(a => a)
        .map(a => a)
    ).toEqual([{}]);
  });

  it("can retrieve a property after a function", async () => {
    expect(await swear([true]).map(a => a)[0]).toBe(true);
    expect(await swear([3]).map(a => a)[0]).toBe(3);
    expect(await swear(["a"]).map(a => a)[0]).toBe("a");
    expect(await swear([[]]).map(a => a)[0]).toEqual([]);
    expect(await swear([{}]).map(a => a)[0]).toEqual({});
  });

  it("cannot call a function response", async () => {
    const message = /You tried to call the non-function/;
    await expect(swear([true]).map(a => a)(a => a)).rejects.toMatchObject({
      message
    });
    await expect(swear([3]).map(a => a)(a => a)).rejects.toMatchObject({
      message
    });
    await expect(swear(["a"]).map(a => a)(a => a)).rejects.toMatchObject({
      message
    });
    await expect(swear([[]]).map(a => a)(a => a)).rejects.toMatchObject({
      message
    });
    await expect(swear([{}]).map(a => a)(a => a)).rejects.toMatchObject({
      message
    });
  });

  it("can retrieve nested items", async () => {
    expect(await swear([[true]])[0][0]).toBe(true);
    expect(await swear([[3]])[0][0]).toBe(3);
    expect(await swear([["a"]])[0][0]).toBe("a");
    expect(await swear([[[]]])[0][0]).toEqual([]);
    expect(await swear([[{}]])[0][0]).toEqual({});
  });

  it("can call a function after a property", async () => {
    expect(await swear([[true]])[0].map(a => a)).toEqual([true]);
    expect(await swear([[3]])[0].map(a => a)).toEqual([3]);
    expect(await swear([["a"]])[0].map(a => a)).toEqual(["a"]);
    expect(await swear([[[]]])[0].map(a => a)).toEqual([[]]);
    expect(await swear([[{}]])[0].map(a => a)).toEqual([{}]);
  });

  it("can combine prop => func => prop", async () => {
    expect(await swear([[true]])[0].map(a => a)[0]).toBe(true);
    expect(await swear([[3]])[0].map(a => a)[0]).toBe(3);
    expect(await swear([["a"]])[0].map(a => a)[0]).toBe("a");
    expect(await swear([[[]]])[0].map(a => a)[0]).toEqual([]);
    expect(await swear([[{}]])[0].map(a => a)[0]).toEqual({});
  });

  it("resolves typeof as expected", async () => {
    expect(typeof (await swear(true))).toBe("boolean");
    expect(typeof (await swear(3))).toBe("number");
    expect(typeof (await swear("a"))).toBe("string");
    expect(typeof (await swear([]))).toBe("object");
    expect(typeof (await swear({}))).toBe("object");

    expect(typeof (await swear(true)) === "boolean").toBe(true);
    expect(typeof (await swear(3)) === "number").toBe(true);
    expect(typeof (await swear("a")) === "string").toBe(true);
    expect(typeof (await swear([])) === "object").toBe(true);
    expect(typeof (await swear({})) === "object").toBe(true);
  });

  it("resolves instances as expected", async () => {
    expect((await swear(new Date())) instanceof Date).toBe(true);
    expect((await swear(new Date())) instanceof Date).toBe(true); // same as above
    expect(Array.isArray(await swear([3]))).toBe(true);
  });

  it("can catch a root error", async () => {
    expect(await swear(Promise.reject().catch(err => "Hello"))).toEqual(
      "Hello"
    );
    expect(await swear(Promise.reject()).catch(err => "Hello")).toEqual(
      "Hello"
    );
  });

  it("continues the chain after .catch()", async () => {
    expect(await swear(Promise.resolve("abc")).split("")).toEqual([
      "a",
      "b",
      "c"
    ]);
    expect(await swear(Promise.resolve("abc")).split("")).toEqual([
      "a",
      "b",
      "c"
    ]);
    expect(await swear(Promise.resolve("abc")).split("")).toEqual([
      "a",
      "b",
      "c"
    ]);
    expect(await swear(Promise.reject("Hello")).catch(err => err)).toEqual(
      "Hello"
    );
    expect(await swear(Promise.reject("Hello")).catch(err => "a b")).toEqual(
      "a b"
    );
    expect(
      typeof swear(Promise.reject("Hello")).catch(err => "a b").split
    ).toBe("function");
    expect(
      await swear(Promise.reject())
        .abc("")
        .catch(err => "Hello")
    ).toEqual("Hello");
  });

  it("ignores intermediate links in the chain until catch", async () => {
    expect(
      await swear(Promise.reject(new Error("rejected")))
        .split("")
        .catch(err => err.message)
    ).toEqual("rejected");
    expect(
      await swear(Promise.reject(new Error("rejected")))
        .abcde("")
        .catch(err => err.message)
    ).toEqual("rejected");
    expect(
      await swear(Promise.reject())
        .split("")
        .catch(err => "Hello")
    ).toEqual("Hello");
    expect(
      await swear(Promise.reject())
        .abcde("")
        .catch(err => "Hello")
    ).toEqual("Hello");
  });

  it("skips intermediate values", async () => {
    let err;
    let called = 0;
    try {
      await swear(reject())
        .split("")
        .map(a => called++);
    } catch (error) {
      err = error;
    }
    expect(err).toMatchObject({ message: /rejected/ });
    expect(called).toEqual(0);
  });

  it("will do its thing even without awaiting", async () => {
    const called = [];

    // Sanity check
    new Promise(ok => called.push("a"));
    await wait();
    expect(called).toEqual(["a"]);

    swear(["b"]).map(it => called.push(it));
    await wait();
    expect(called).toEqual(["a", "b"]);
  });
});

describe("numbers", () => {
  it("initializes with a number", async () => {
    expect(await swear(3)).toBe(3);
    expect(await swear(3.3)).toBe(3.3);
  });

  it("can call number methods", async () => {
    expect(await swear(3).toFixed(1)).toBe("3.0");
    expect(await swear(3.33).toFixed(1)).toBe("3.3");
  });

  it("can concatenate to other methods", async () => {
    expect(
      await swear(3)
        .toFixed(1)
        .split(".")
    ).toEqual(["3", "0"]);
    expect(
      await swear(3.33)
        .toFixed(1)
        .split(".")
    ).toEqual(["3", "3"]);
  });

  it("can perform several operations", async () => {
    expect(
      await swear(3.1)
        .toFixed(1)
        .split(".")
        .map(n => n * 2)
        .join(".")
    ).toBe("6.2");
  });
});

describe("strings", () => {
  it("initializes with strings", async () => {
    expect(await swear("")).toBe("");
    expect(await swear("Hello")).toBe("Hello");
  });

  it("can perform a single operation", async () => {
    expect(await swear("Hello world").slice(0, 5)).toEqual("Hello");
  });

  it("can transform to other type", async () => {
    expect(await swear("Hello world").split(" ")).toEqual(["Hello", "world"]);
  });
});

describe("arrays", () => {
  const compare = function(a) {
    return a > this;
  };
  const compareAsync = async function(a) {
    await wait();
    return a > this;
  };

  it("can do a simple map", async () => {
    expect(await swear([3, "a"]).map(a => a + a)).toEqual([6, "aa"]);
  });

  it("does not perform mutation for pure functions", async () => {
    const a = swear([3, "a"]);
    expect(await a).toEqual([3, "a"]);
    expect(await a.map(a => a + a)).toEqual([6, "aa"]);
    expect(await a).toEqual([3, "a"]);
  });

  it("resolves promises like Promise.all()", async () => {
    const array = ["a", Promise.resolve("b")];
    // expect(await swear(array)).toEqual(['a', 'b']);
    expect(await swear(array).map(a => a)).toEqual(["a", "b"]);
  });

  it("resolves promises like Promise.all() recursively", async () => {
    const array = ["a", Promise.resolve("b"), [Promise.resolve("c")]];
    expect(await swear(array)).toEqual(["a", "b", ["c"]]);
  });

  it("resolves promises like Promise.all() recursively", async () => {
    const array = ["a", Promise.resolve("b"), [Promise.reject("c")]];
    expect(await swear(array).catch(err => err)).toEqual("c");
  });

  describe(".every()", () => {
    it("can do the simple operation", async () => {
      expect(await swear([]).every(a => a > 0)).toEqual(true);
      expect(await swear([1, 2, 3]).every(a => a > 0)).toEqual(true);
      expect(await swear([1, 2, 3]).every(a => a > 1)).toEqual(false);
    });

    it("maintains this", async () => {
      expect(await swear([1, 2, 3]).every(compare, 0)).toEqual(true);
      expect(await swear([1, 2, 3]).every(compare, 2)).toEqual(false);
    });

    it("can do a regexp every", async () => {
      expect(await swear(["a", "b", "c"]).every(/(a|b|c)/)).toEqual(true);
      expect(await swear(["a", "b", "c"]).every(/(b|c)/)).toEqual(false);
    });

    it("can do an async every", async () => {
      expect(await swear([1, 2, 3]).every(async a => a > 0)).toEqual(true);
      expect(await swear([1, 2, 3]).every(async a => a > 1)).toEqual(false);
    });

    it("stops when it finds it", async () => {
      let count = 0;
      expect(
        await swear([1, 2, 3]).every(async a => {
          count++;
          await wait();
          return a !== 1;
        })
      );
      expect(count).toBe(1);
    });

    it("maintains this on an async every", async () => {
      expect(await swear([1, 2, 3]).every(compareAsync, 0)).toEqual(true);
      expect(await swear([1, 2, 3]).every(compareAsync, 1)).toEqual(false);
    });

    it("can do an async every after chaining it", async () => {
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .every(async a => a > 0)
      ).toEqual(true);
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .every(async a => a > 3)
      ).toEqual(false);
    });

    it("has all the right params for every", async () => {
      await swear([0, 1, 2]).every(async (a, i, all) => {
        expect(a).toEqual(i);
        expect(all).toEqual([0, 1, 2]);
        return true;
      });
    });
  });

  describe(".filter()", () => {
    it("can do a simple filter", async () => {
      expect(await swear([1, 2, 3]).filter(a => a > 1)).toEqual([2, 3]);
    });

    it("maintains this on filter", async () => {
      expect(await swear([1, 2, 3]).filter(compare, 1)).toEqual([2, 3]);
      expect(await swear([1, 2, 3]).filter(compare, 3)).toEqual([]);
    });

    it("can do a regexp filter", async () => {
      expect(await swear(["a", "b", "c"]).filter(/(b|c)/)).toEqual(["b", "c"]);
    });

    it("can do an async filter", async () => {
      expect(await swear([1, 2, 3]).filter(async a => a > 1)).toEqual([2, 3]);
    });

    it("maintains this on an async filter", async () => {
      expect(await swear([1, 2, 3]).filter(compareAsync, 1)).toEqual([2, 3]);
      expect(await swear([1, 2, 3]).filter(compareAsync, 3)).toEqual([]);
    });

    it("can do an async filter and chain it", async () => {
      expect(
        await swear([1, 2, 3])
          .filter(async a => a > 1)
          .map(async a => a ** 2)
      ).toEqual([4, 9]);
    });

    it("can do an async filter after chaining it", async () => {
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .filter(async a => a > 1)
      ).toEqual([4, 9]);
    });

    it("has all the right params for filter", async () => {
      await swear([0, 1, 2]).filter(async (a, i, all) => {
        expect(a).toEqual(i);
        expect(all).toEqual([0, 1, 2]);
        return true;
      });
    });
  });

  describe(".find()", () => {
    it("can do a simple find()", async () => {
      expect(await swear([1, 2, 3]).find(a => a > 1)).toEqual(2);
      expect(await swear([1, 2, 3]).find(a => a > 5)).toEqual(undefined);
    });

    it("resolves before using it", async () => {
      expect(await swear([1, Promise.resolve(2), 3]).find(a => a > 1)).toEqual(
        2
      );
      expect(await swear([1, 2, 3]).find(a => a > 5)).toEqual(undefined);
    });

    it("is undefined if nothing is found", async () => {
      expect(await swear([1, 2, 3]).find(a => a > 5)).toEqual(undefined);
    });

    it("maintains this on filter", async () => {
      expect(await swear([1, 2, 3]).find(compare, 1)).toEqual(2);
      expect(await swear([1, 2, 3]).find(compare, 3)).toEqual(undefined);
    });

    it("can do a regexp filter", async () => {
      expect(await swear(["a", "b", "c"]).find(/(b|c)/)).toEqual("b");
    });

    it("can do an async filter", async () => {
      expect(await swear([1, 2, 3]).find(async a => a > 1)).toEqual(2);
    });

    it("stops when it finds it", async () => {
      let count = 0;
      expect(
        await swear([1, 2, 3]).find(async a => {
          count++;
          await wait();
          return a === 1;
        })
      );
      expect(count).toBe(1);
    });

    it("maintains this on an async filter", async () => {
      expect(await swear([1, 2, 3]).find(compareAsync, 1)).toEqual(2);
      expect(await swear([1, 2, 3]).find(compareAsync, 3)).toEqual(undefined);
    });

    it("can do an async filter after chaining it", async () => {
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .find(async a => a > 1)
      ).toEqual(4);
    });

    it("has all the right params for filter", async () => {
      expect(
        await swear([0, 1, 2]).find(async (a, i, all) => {
          expect(a).toEqual(i);
          expect(all).toEqual([0, 1, 2]);
          return a > 1;
        })
      ).toEqual(2);
    });
  });

  describe(".findIndex()", () => {
    it("can do a simple findIndex()", async () => {
      expect(await swear([1, 2, 3]).findIndex(a => a > 1)).toEqual(1);
      expect(await swear([1, 2, 3]).findIndex(a => a > 5)).toEqual(-1);
    });

    it("is -1 if nothing is found", async () => {
      expect(await swear([1, 2, 3]).findIndex(a => a > 5)).toEqual(-1);
    });

    it("maintains this on filter", async () => {
      expect(await swear([1, 2, 3]).findIndex(compare, 1)).toEqual(1);
      expect(await swear([1, 2, 3]).findIndex(compare, 3)).toEqual(-1);
    });

    it("can do a regexp filter", async () => {
      expect(await swear(["a", "b", "c"]).findIndex(/(b|c)/)).toEqual(1);
    });

    it("can do an async filter", async () => {
      expect(await swear([1, 2, 3]).findIndex(async a => a > 1)).toEqual(1);
    });

    it("stops when it finds it", async () => {
      let count = 0;
      expect(
        await swear([1, 2, 3]).findIndex(async a => {
          count++;
          await wait();
          return a === 1;
        })
      );
      expect(count).toBe(1);
    });

    it("maintains this on an async filter", async () => {
      expect(await swear([1, 2, 3]).findIndex(compareAsync, 1)).toEqual(1);
      expect(await swear([1, 2, 3]).findIndex(compareAsync, 3)).toEqual(-1);
    });

    it("can do an async filter after chaining it", async () => {
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .findIndex(async a => a > 1)
      ).toEqual(1);
    });

    it("has all the right params for filter", async () => {
      expect(
        await swear([0, 1, 2]).findIndex(async (a, i, all) => {
          expect(a).toEqual(i);
          expect(all).toEqual([0, 1, 2]);
          return a > 1;
        })
      ).toEqual(2);
    });
  });

  describe(".forEach()", () => {
    it("can do a simple forEach()", async () => {
      const all = [];
      expect(
        await swear([1, 2, 3]).forEach(a => {
          all.push(a);
        })
      ).toEqual([1, 2, 3]);
      expect(all).toEqual([1, 2, 3]);
    });

    it("maintains this", async () => {
      await swear([1]).forEach(function() {
        expect(this).toBe(25);
      }, 25);
      await swear([1]).forEach(async function() {
        expect(this).toBe(25);
      }, 25);
    });

    it("is chainable", async () => {
      expect(
        await swear([1, 2, 3])
          .forEach(a => false)
          .map(a => a ** 2)
      ).toEqual([1, 4, 9]);
      expect(
        await swear([1, 2, 3])
          .map(a => a ** 2)
          .forEach(a => false)
      ).toEqual([1, 4, 9]);
      expect(
        await swear([1, 2, 3])
          .forEach(async a => false)
          .map(a => a ** 2)
      ).toEqual([1, 4, 9]);
      expect(
        await swear([1, 2, 3])
          .map(a => a ** 2)
          .forEach(async a => false)
      ).toEqual([1, 4, 9]);
    });

    it("has all the right params for filter", async () => {
      await swear([0, 1, 2]).forEach(async (a, i, all) => {
        expect(a).toEqual(i);
        expect(all).toEqual([0, 1, 2]);
        return true;
      });
    });
  });

  describe(".reduce()", () => {
    it("can do a simple reduce", async () => {
      expect(await swear([1, 2, 3]).reduce((a, b) => a + b)).toEqual(6);
      expect(await swear([1, 2, 3]).reduce((a, b) => a + b, 0)).toEqual(6);
    });

    // Init is by reference, see https://jsfiddle.net/franciscop/1bdsxonp/2/
    it("passes the init by reference", async () => {
      const init = { a: 0 };
      await swear([1, 2, 3]).reduce((init, b) => {
        init.a++;
        return init;
      }, init);
      expect(init.a).toBe(3);
    });

    it("can do a simple async", async () => {
      expect(await swear([1, 2, 3]).reduce(async (a, b) => a + b)).toEqual(6);
      expect(await swear([1, 2, 3]).reduce(async (a, b) => a + b, 0)).toEqual(
        6
      );
    });

    // Init is by reference, see https://jsfiddle.net/franciscop/1bdsxonp/2/
    it("passes the init by reference on async", async () => {
      const init = { a: 0 };
      await swear([1, 2, 3]).reduce(async (init, b) => {
        init.a++;
        await wait();
        return init;
      }, init);
      expect(init.a).toBe(3);
    });

    it("can do an async reduce and chain it", async () => {
      expect(
        await swear([1, 2, 3])
          .reduce(async (a, b) => a + b)
          .toFixed(0)
      ).toEqual("6");
    });

    it("can do an async reduce after chaining it", async () => {
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .reduce(async (a, b) => a + b)
      ).toEqual(14);
    });

    it("has all the right params for reduce", async () => {
      await swear([0, 1, 2]).reduce(
        async (init, a, i, all) => {
          expect(init).toEqual({ a: "b" });
          expect(a).toEqual(i);
          expect(all).toEqual([0, 1, 2]);
          return init;
        },
        { a: "b" }
      );
    });
  });

  describe(".reduceRight()", () => {
    it("can do a simple reduceRight", async () => {
      expect(await swear([1, 2, 3]).reduceRight((a, b) => a + b)).toEqual(6);
      expect(await swear([1, 2, 3]).reduceRight((a, b) => a + b, 0)).toEqual(6);
    });

    // Init is by reference, see https://jsfiddle.net/franciscop/1bdsxonp/2/
    it("passes the init by reference", async () => {
      const init = { a: 0 };
      await swear([1, 2, 3]).reduceRight((init, b) => {
        init.a++;
        return init;
      }, init);
      expect(init.a).toBe(3);
    });

    it("can do a simple async", async () => {
      expect(await swear([1, 2, 3]).reduceRight(async (a, b) => a + b)).toEqual(
        6
      );
      expect(
        await swear([1, 2, 3]).reduceRight(async (a, b) => a + b, 0)
      ).toEqual(6);
    });

    // Init is by reference, see https://jsfiddle.net/franciscop/1bdsxonp/2/
    it("passes the init by reference on async", async () => {
      const init = { a: 0 };
      await swear([1, 2, 3]).reduceRight(async (init, b) => {
        init.a++;
        await wait();
        return init;
      }, init);
      expect(init.a).toBe(3);
    });

    it("can do an async reduceRight and chain it", async () => {
      expect(
        await swear([1, 2, 3])
          .reduceRight(async (a, b) => a + b)
          .toFixed(0)
      ).toEqual("6");
    });

    it("can do an async reduceRight after chaining it", async () => {
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .reduceRight(async (a, b) => a + b)
      ).toEqual(14);
    });

    it("has all the right params for reduceRight", async () => {
      await swear([0, 1, 2]).reduceRight(
        async (init, a, i, all) => {
          expect(init).toEqual({ a: "b" });
          expect(a).toEqual(i);
          expect(all).toEqual([0, 1, 2]);
          return init;
        },
        { a: "b" }
      );
    });
  });

  describe(".some()", () => {
    it("can do the simple operation", async () => {
      expect(await swear([]).some(a => a > 0)).toEqual(false);
      expect(await swear([1, 2, 3]).some(a => a > 1)).toEqual(true);
      expect(await swear([1, 2, 3]).some(a => a > 3)).toEqual(false);
    });

    it("maintains this", async () => {
      expect(await swear([1, 2, 3]).some(compare, 1)).toEqual(true);
      expect(await swear([1, 2, 3]).some(compare, 3)).toEqual(false);
    });

    it("can do a regexp filter", async () => {
      expect(await swear(["a", "b", "c"]).some(/(b|c)/)).toEqual(true);
      expect(await swear(["a", "b", "c"]).some(/(d|e)/)).toEqual(false);
    });

    it("can do an async filter", async () => {
      expect(await swear([1, 2, 3]).some(async a => a > 1)).toEqual(true);
      expect(await swear([1, 2, 3]).some(async a => a > 3)).toEqual(false);
    });

    it("stops when it finds it", async () => {
      let count = 0;
      expect(
        await swear([1, 2, 3]).some(async a => {
          count++;
          await wait();
          return a === 1;
        })
      );
      expect(count).toBe(1);
    });

    it("maintains this on an async filter", async () => {
      expect(await swear([1, 2, 3]).some(compareAsync, 1)).toEqual(true);
      expect(await swear([1, 2, 3]).some(compareAsync, 3)).toEqual(false);
    });

    it("can do an async filter after chaining it", async () => {
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .some(async a => a > 1)
      ).toEqual(true);
      expect(
        await swear([1, 2, 3])
          .map(async a => a ** 2)
          .some(async a => a > 9)
      ).toEqual(false);
    });

    it("has all the right params for filter", async () => {
      await swear([0, 1, 2]).some(async (a, i, all) => {
        expect(a).toEqual(i);
        expect(all).toEqual([0, 1, 2]);
        return true;
      });
    });
  });
});

describe("objects", () => {
  it("initializes with objects", async () => {
    expect(await swear({})).toEqual({});
    expect(await swear({ a: 3 })).toEqual({ a: 3 });
    expect(await swear({ a: 3, b: "c" })).toEqual({ a: 3, b: "c" });
  });

  it("can retrieve nested properties", async () => {
    // console.log(await swear({ a: { b: 'c' } }).a);
    expect(await swear({ a: { b: "c" } }).a.b).toBe("c");
  });
});

describe("extend", () => {
  const double = obj => obj + obj;
  const doubleArray = obj => obj.map(double);

  it("can accept no options", async () => {
    await swear("a");
    await swear("a", {});
  });

  it("can extend anything", async () => {
    const opts = { double };
    expect(await swear(1, opts).double()).toEqual(2);
    expect(await swear("a", opts).double()).toEqual("aa");
  });

  it("can extend numbers", async () => {
    const opts = { number: { double } };
    expect(await swear(1, opts).double()).toEqual(2);
  });

  it("can extend strings", async () => {
    const opts = { string: { double } };
    expect(await swear("a", opts).double()).toEqual("aa");
  });

  it("can extend arrays", async () => {
    const opts = { array: { double: doubleArray } };
    expect(await swear([1], opts).double()).toEqual([2]);
    expect(await swear(["a"], opts).double()).toEqual(["aa"]);
  });

  it("can be extended later in the chain", async () => {
    const opts = { array: { double: doubleArray } };
    expect(
      await swear(["a"], opts)
        .map(a => a)
        .double()
    ).toEqual(["aa"]);
  });

  it("returns the proper instance", async () => {
    const opts = { array: { double: doubleArray } };
    expect(
      await swear(["a"], opts)
        .double()
        .map(a => a)
    ).toEqual(["aa"]);
  });

  it("has the right arguments", async () => {
    const array = {
      abc: (obj, ...args) => "a" + obj.join("") + args.join("") + "f"
    };
    expect(
      await swear(["b", "c"], { array })
        .map(a => a)
        .abc("d", "e")
    ).toBe("abcdef");
  });
});

describe("examples", () => {
  describe("DB library", () => {
    const db = (() => {
      const users = [
        { id: 0, name: "Maria", address: { city: "London" } },
        { id: 1, name: "John", address: { city: "London" } }
      ];
      const courses = [];

      const find = function(obj, filter) {
        const [key, value] = Object.entries(filter)[0];
        const result = obj.find(obj => obj[key] === value);
        if (!result) throw new Error(`Item not found for the filter ${filter}`);
        return obj.find(obj => obj[key] === value);
      };

      return swear({ users, courses }, { find });
    })();

    it("can be initialized", async () => {
      const name = await db.users.find({ id: 1 }).name;
      expect(name).toEqual("John");

      const city = await db.users.find({ id: 1 }).address.city;
      expect(city).toEqual("London");
    });
  });
});
