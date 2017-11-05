const { test } = require('ava');

const UniqueArray = require('../../../classes/Array/UniqueArray');

test('should throw if no key given', t => {
  const err = t.throws(() => {
    const arr = new UniqueArray();
  });
  t.true(err instanceof Error);
});

test('should only allow unique values, based on key', t => {
  const arr = new UniqueArray('name');
  arr.push({
    name: 'Tim',
    age: 32
  });
  arr.push({
    name: 'Nathan',
    age: 36
  });
  arr.push({
    name: 'Tim',
    age: 100
  });
  arr.push({
    name: 'Adam',
    age: 39
  });
  arr.push({
    name: 'Adam',
    age: 101
  });

  t.equal(arr.length, 3);
  t.deepEqual(arr.map(obj => obj.name), ['Tim', 'Nathan', 'Adam']);
});

test('should be an instance of Array', t => {
  const arr = new UniqueArray('key');
  t.true(arr instanceof Array);
});

test('should accept initial values', t => {
  const arr = new UniqueArray('key', ['a', 'b', 'ccc']);
  t.deepEqual(arr, ['a', 'b', 'ccc']);
});

test('.native should return a native arary', t => {
  const arr = new UniqueArray('key');
  const native = arr.native;
  t.true(arr instanceof UniqueArray);
  t.true(native instanceof Array);
  t.true(arr !== native);
  t.false(native instanceof UniqueArray);
});

test('.native should have expected values', t => {
  const arr = new UniqueArray('key', ['x', 'y', 'z']);
  const native = arr.native;
  t.deepEqual(native, ['x', 'y', 'z']);
});

test('.concat() should return an instance of UniqueArray', t => {
  const arr = new UniqueArray('key', ['a']);
  const newArr = arr.concat('b');
  t.true(newArr instanceof UniqueArray);
});

test('.concat() should concat from a native array', t => {
  const arr = new UniqueArray('key', ['a', 's']);
  const newArr = arr.concat(['d', 'f']);
  t.deepEqual(newArr, ['a', 's', 'd', 'f']);

  const arr2 = new UniqueArray('key', ['a', 's']);
  const newArr2 = arr.concat('d', 'f');
  t.deepEqual(newArr2, ['a', 's', 'd', 'f']);
});

test('.copyWithin() should throw', t => {
  const arr = new UniqueArray('key');
  const err = t.throws(() => {
    arr.copyWithin();
  });
  t.true(err instanceof Error);
});

test('.fill() should throw', t => {
  const arr = new UniqueArray('key');
  const err = t.throws(() => {
    arr.fill();
  });
  t.true(err instanceof Error);
});

test('.filter() should return a UniqueArray', t => {
  const arr = new UniqueArray('key', ['a', 'b', 'c', 'd']);
  const arr2 = arr.filter(val => {
    return true;
  });
  t.true(arr2 instanceof UniqueArray);
});

test('.filter() should filter when truthy', t => {
  const arr = new UniqueArray('key', ['a', 'b', 'c', 'd']);
  const want = ['b', 'd'];
  const arr2 = arr.filter(val => {
    return want.inclues(val);
  });
  t.deepEqual(arr2, ['b', 'd']);
});

test('.filter() should bind to array, if no bind given', t => {
  const arr = new UniqueArray('ad', ['a', 'b', 'c', 'd']);
  const arr2 = arr.filter(val => {
    return this.UniqueKey.split('').includes(val);
  });
  t.deepEqual(arr2, ['a', 'd']);
});

test('.filter() should bind if given a bind arg', t => {
  const arr = new UniqueArray('key', ['a', 'b', 'c', 'd']);
  const want = ['a', 'c'];
  const arr2 = arr.filter(val => {
    return this.split('').includes(val);
  }, want);
  t.deepEqual(arr2, ['a', 'c']);
});

test('.pop() should pop off last value', t => {
  const arr = new UniqueArray('key', ['one', 'two', 'three']);
  const popped = arr.pop();
  t.equal(popped, 'three');
});

test('.pop() should alter the array', t => {
  const arr = new UniqueArray('key', ['one', 'two', 'three']);
  const popped = arr.pop();
  t.deepEqual(arr, ['one', 'two']);
});

test('after .pop() should be able to re-add a unique value', t => {
  const arr = new UniqueArray('number');
  arr.push({
    number: 'one'
  });
  arr.push({
    number: 'two'
  });
  arr.push({
    number: 'three'
  });

  const popped = arr.pop();
  t.equal(popped.number, 'three');
  t.equal(arr.length, 2);
  t.deepEqual(arr, [{ number: 'one' }, { number: 'two' }]);

  arr.push({
    number: 'three'
  });
  t.equal(arr.length, 3);
  t.deepEqual(arr, [{ number: 'one' }, { number: 'two' }, { number: 'three' }]);
});

test('.reduce() should throw', t => {
  const arr = new UniqueArray('key');
  const err = t.throws(() => {
    arr.reduce();
  });
  t.true(err instanceof Error);
});

test('.reduceRight() should throw', t => {
  const arr = new UniqueArray('key');
  const err = t.throws(() => {
    arr.reduceRight();
  });
  t.true(err instanceof Error);
});
