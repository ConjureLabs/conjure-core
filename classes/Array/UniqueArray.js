const ContentError = require('conjure-core/modules/err').ContentError;
const UserError = require('conjure-core/modules/err').UserError;

const slice = Array.prototype.slice;

/*

There is a common pattern where values need to be pushed into an array, skipping any duplicates.
When doing this with objects (like API results) you will often check against one key.

For example, you may have something like:

```js
const allRepos = [];
const repoNames = [];

githubClient.me().repos((err, repos) => {
  if (err) {
    throw err;
  }

  // ensuring that our repos list only contains unique repos
  for (let i = 0; i < repos.length; i++) {
    let currentRepoName = repos[i].full_name;

    if (repoNames.includes(currentRepoName)) {
      continue;
    }

    repoNames.push(currentRepoName);
    allRepos.push(repos[i]);
  }
});

// continue adding to `allRepos` array...
```

This results in some messy code, that can make bugs hard to detect.

UniqueArray allows you to create an array of objects that only accept cells with a unique key.

The above example could be re-written as:

```js
const allRepos = new UniqueArray('full_name');

githubClient.me().repos((err, repos) => {
  if (err) {
    throw err;
  }

  // ensuring that our repos list only contains unique repos
  for (let i = 0; i < repos.length; i++) {
    allRepos.push(repos[i]);
  }
});

// continue adding to `allRepos` array...
```
 */

class UniqueArray extends Array {
  constructor(uniqueKey, initial) {
    super();

    if (typeof uniqueKey !== 'string' || !uniqueKey.trim()) {
      throw new ContentError('UniqueArray requires a key, to filter contents with');
    }

    this.uniqueKey = uniqueKey.trim();
    this.have = [];

    if (Array.isArray(initial)) {
      for (let i = 0; i < initial.length; i++) {
        this.push(initial[i]);
      }
    }
  }

  get native() {
    return [].concat(this);
  }

  of() {
    return new UniqueArray(this.uniqueKey, slice.call(arguments));
  }

  concat() {
    const nativeResult = Array.prototype.concat.apply(this.native, arguments);
    return new UniqueArray(this.uniqueKey, nativeResult);
  }

  copyWithin() {
    throw new UserError('Can not call .copyWithin() on a UniqueArray');
  }

  fill() {
    throw new UserError('Can not call .fill() on a UniqueArray');
  }

  filter(func, bind) {
    const native = this.native;
    const filteredNative = native.filter(func, arguments.length > 1 ? bind : native);
    return new UniqueArray(this.uniqueKey, filteredNative);
  }

  pop() {
    const popped = super.pop();
    const keyRemoved = popped[ this.uniqueKey ];
    this.have.splice(this.have.indexOf(keyRemoved), 1);
    return popped;
  }

  push() {
    const args = slice.call(arguments);

    for (let i = 0; i < args.length; i++) {
      let argKey = args[i][ this.uniqueKey ];

      if (this.have.includes(argKey)) {
        continue;
      }

      this.have.push(argKey);
      super.push(args[i]);
    }

    return this.length;
  }

  reduce() {
    throw new UserError('You can not .reduce() a UniqueArray - Use .native to get a native array');
  }

  reduceRight() {
    throw new UserError('You can not .reduceRight() a UniqueArray - Use .native to get a native array');
  }

  reverse() {
    super.reverse();
  }

  sort() {
    throw new UserError('You can not .sort() a UniqueArray - Use .native to get a native array');
  }

  shift() {
    const shifted = super.shift();
    const keyRemoved = shifted[ this.uniqueKey ];
    this.have.splice(this.have.indexOf(keyRemoved), 1);
    return shifted;
  }

  slice() {
    const native = this.native;
    const sliced = native.slice.apply(native, arguments);
    return new UniqueArray(this.uniqueKey, sliced);
  }

  splice() {
    const native = this.native;
    const spliced = native.splice.apply(native, arguments);
    return new UniqueArray(this.uniqueKey, spliced);
  }

  unshift() {
    const args = slice.call(arguments);

    for (let i = 0; i < args.length; i++) {
      let argKey = args[i][ this.uniqueKey ];

      if (this.have.includes(argKey)) {
        continue;
      }

      this.have.unshift(argKey);
      super.unshift(args[i]);
    }

    return this.length;
  }
}

module.exports = UniqueArray;
