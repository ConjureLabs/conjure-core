const { test } = require('ava');

const sortInsensitive = require('../../../../modules/utils/Array/sort-insensitive');

test('should modify the array', t => {
  const example = ['f', 'B', 'a', 'G', 'C', 'E', 'd', 'h'];
  const exampleStart = example.join('');
  sortInsensitive(example);

  if (example.join('') !== exampleStart) {
    return t.pass();
  }
  t.fail();
});

test('should sort array of strings case insensitive', t => {
  const example = ['f', 'B', 'a', 'G', 'C', 'E', 'd', 'h'];
  sortInsensitive(example);

  if (example.join('') === 'aBCdEfGh') {
    return t.pass();
  }
  t.fail();
});

test('should sort objects, if given a key', t => {
  const tim = {
    fname: 'Tim',
    born: 'USA'
  };
  const ivarin = {
    fname: 'ivarin',
    born: 'Thailand'
  };
  const matilda = {
    fname: 'MATILDA',
    born: 'Thailand'
  };

  const example = [tim, ivarin, matilda];
  sortInsensitive(example, 'fname');

  if (example[0] === ivarin && example[1] === matilda && example[2] === tim) {
    return t.pass();
  }
  t.fail();
});
