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

  t.is(arr.length, 3);
  t.deepEqual(arr.native.map(obj => obj.name), ['Tim', 'Nathan', 'Adam']);
});

test('should keep order', t => {
  const arr = new UniqueArray('kind', [
    { kind: 'dog' },
    { kind: 'cat' }
  ]);
  arr.push({ kind: 'owl' });

  t.deepEqual(arr[0], { kind: 'dog' });
  t.deepEqual(arr[1], { kind: 'cat' });
  t.deepEqual(arr[2], { kind: 'owl' });
});

test('should be an instance of Array', t => {
  const arr = new UniqueArray('key');
  t.true(arr instanceof Array);
});

test('should accept initial values', t => {
  const initial = [
    { val: 'a' },
    { val: 'b' },
    { val: 'ccc' }
  ];
  const arr = new UniqueArray('val', initial);
  t.deepEqual(arr.native, initial);
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
  const initial = [
    { val: 'x' },
    { val: 'y' },
    { val: 'z' }
  ];
  const arr = new UniqueArray('val', initial);
  const native = arr.native;
  t.deepEqual(native, initial);
});

test('.concat() should return an instance of UniqueArray', t => {
  const arr = new UniqueArray('val', [{ val: 'a' }]);
  const newArr = arr.concat({ val: 'b' });
  t.true(newArr instanceof UniqueArray);
});

test('.concat() should concat from a native array', t => {
  const arr = new UniqueArray('val', [{ val: 'a' }, { val: 's' }]);
  const newArr = arr.concat([{ val: 'd' }, { val: 'f' }]);
  t.deepEqual(newArr.native, [{ val: 'a' }, { val: 's' }, { val: 'd' }, { val: 'f' }]);

  const arr2 = new UniqueArray('val', [{ val: 'a' }, { val: 's' }]);
  const newArr2 = arr.concat({ val: 'd' }, { val: 'f' });
  t.deepEqual(newArr2.native, [{ val: 'a' }, { val: 's' }, { val: 'd' }, { val: 'f' }]);
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
  const arr = new UniqueArray('val', [{ val: 'a' }, { val: 'b' }, { val: 'c' }, { val: 'd' }]);
  const arr2 = arr.filter(val => {
    return true;
  });
  t.true(arr2 instanceof UniqueArray);
});

test('.filter() should filter when truthy', t => {
  const arr = new UniqueArray('val', [{ val: 'a' }, { val: 'b' }, { val: 'c' }, { val: 'd' }]);
  const want = ['b', 'd'];
  const arr2 = arr.filter(cell => {
    return want.includes(cell.val);
  });
  t.deepEqual(arr2.native, [{ val: 'b' }, { val: 'd' }]);
});

test('.filter() should bind to native array, if no bind given', t => {
  const arr = new UniqueArray('val', [{ val: 'a' }, { val: 'b' }, { val: 'c' }, { val: 'd' }]);
  const want = ['a', 'c'];
  const arr2 = arr.filter(function(cell) {
    t.deepEqual(this, arr.native);
    return want.includes(cell.val);
  });
  t.deepEqual(arr2.native, [{ val: 'a' }, { val: 'c' }]);
});

test('.filter() should bind if given a bind arg', t => {
  const arr = new UniqueArray('val', [{ val: 'a' }, { val: 'b' }, { val: 'c' }, { val: 'd' }]);
  const want = ['a', 'c'];
  const arr2 = arr.filter(function(cell) {
    return this === want && this.includes(cell.val);
  }, want);
  t.deepEqual(arr2.native, [{ val: 'a' }, { val: 'c' }]);
});

test('.pop() should pop off last value', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  const popped = arr.pop();
  t.deepEqual(popped, { number: 'three' });
});

test('.pop() should alter the array', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  arr.pop();
  t.deepEqual(arr.native, [{ number: 'one' }, { number: 'two' }]);
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
  t.is(popped.number, 'three');
  t.is(arr.length, 2);
  t.deepEqual(arr.native, [{ number: 'one' }, { number: 'two' }]);

  arr.push({
    number: 'three'
  });
  t.is(arr.length, 3);
  t.deepEqual(arr.native, [{ number: 'one' }, { number: 'two' }, { number: 'three' }]);
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

test('.reverse() should reverse the array', t => {
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
  
  arr.reverse();
  t.deepEqual(arr[0], { number: 'three' });
  t.deepEqual(arr[1], { number: 'two' });
  t.deepEqual(arr[2], { number: 'one' });
});

test('.sort() should throw', t => {
  const arr = new UniqueArray('key');
  const err = t.throws(() => {
    arr.sort();
  });
  t.true(err instanceof Error);
});

test('.shift() should shift off first value', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  const shifted = arr.shift();
  t.deepEqual(shifted, { number: 'one' });
});

test('.shift() should alter the array', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  arr.shift();
  t.deepEqual(arr.native, [{ number: 'two' }, { number: 'three' }]);
});

test('after .shift() should be able to re-add a unique value', t => {
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

  const shifted = arr.shift();
  t.is(shifted.number, 'one');
  t.is(arr.length, 2);
  t.deepEqual(arr.native, [{ number: 'two' }, { number: 'three' }]);

  arr.push({
    number: 'one'
  });
  t.is(arr.length, 3);
  t.deepEqual(arr.native, [{ number: 'two' }, { number: 'three' }, { number: 'one' }]);
});

test('.slice() should return a UniqueArray', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  const arr2 = arr.slice();
  t.true(arr2 instanceof UniqueArray);
});

test('.slice() should not equal original', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  const arr2 = arr.slice();
  t.true(arr2 !== arr);
});

test('.slice() should honor index args', t => {
  const initial = [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ];
  const arr = new UniqueArray('number', initial);

  const arr2 = arr.slice(0);
  t.deepEqual(arr2.native, initial);

  const arr3 = arr.slice(0, 0);
  t.deepEqual(arr3.native, initial);

  const arr4 = arr.slice(2);
  t.deepEqual(arr4.native, initial.slice(2));

  const arr5 = arr.slice(-3);
  t.deepEqual(arr5.native, initial.slice(-3));

  const arr6 = arr.slice(1, 3);
  t.deepEqual(arr6.native, initial.slice(1, 3));
});

test('.splice() should return a UniqueArray', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  const arr2 = arr.splice();
  t.true(arr2 instanceof UniqueArray);
});

test('.splice() should not equal original', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  const arr2 = arr.splice();
  t.true(arr2 !== arr);
});

test('.splice() should alter original', t => {
  const arr = new UniqueArray('number', [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' }
  ]);
  arr.splice(0, 2);
  t.is(arr.length, 1);
});

test('.splice() should strip index range given from origin array', t => {
  const initial = [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ];
  const arr = new UniqueArray('number', initial);
  const spliced = arr.splice(1, 3);

  t.deepEqual(spliced.native, [ { number: 'two' }, { number: 'three' }, { number: 'four' } ]);
  console.log(arr.native);
  t.deepEqual(arr.native, [ { number: 'one' }, { number: 'five' }, { number: 'six' } ]);
});

test('.splice() should inject values if given', t => {
  const initial = [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ];
  const arr = new UniqueArray('number', initial);
  arr.splice(1, 2, { number: 'zero' });
  t.deepEqual(arr.native, [
    { number: 'one' },
    { number: 'zero' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ]);

  const arr2 = new UniqueArray('number', initial);
  arr2.splice(2, 99, { number: 'million' }, { number: 'billion' });
  t.deepEqual(arr.native, [
    { number: 'one' },
    { number: 'two' },
    { number: 'million' },
    { number: 'billion' }
  ]);
});

test('.splice() should not allow duplicate values', t => {
  const initial = [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ];
  const arr = new UniqueArray('number', initial);
  arr.splice(1, 2, { number: 'four' }, { number: 'zero' });
  t.deepEqual(arr.native, [
    { number: 'one' },
    { number: 'zero' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ]);
});

test('.unshift() should return array length', t => {
  const initial = [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ];
  const arr = new UniqueArray('number', initial);
  t.is(arr.unshift(), 6);
});

test('.unshift() should shift in values, to original array', t => {
  const initial = [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ];
  const arr = new UniqueArray('number', initial);
  arr.unshift({ number: 'zero '}, { number: 'infinity' });
  t.is(arr.length, 8);
  t.deepEqual(arr[ arr.length - 1], { number: 'six' });
  t.deepEqual(arr[0], { number: 'zero' });
  t.deepEqual(arr[1], { number: 'infinity' });
  t.deepEqual(arr[2], { number: 'one' });
});

test('.unshift() should not allow duplicate values', t => {
  const initial = [
    { number: 'one' },
    { number: 'two' },
    { number: 'three' },
    { number: 'four' },
    { number: 'five' },
    { number: 'six' }
  ];
  const arr = new UniqueArray('number', initial);
  arr.unshift({ number: 'zero '}, { number: 'five' });
  t.is(arr.length, 7);
});
