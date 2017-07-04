# Waterfall Async Worker

Similar to [the async module's waterfall](https://caolan.github.io/async/docs.html#waterfall), but with one additional quirk: an extra function is passed to each task worker, that allows the flow to break, without returning an error.

## Simple Example

```js
const waterfall = require('conjure-core/modules/async/waterfall');

const tasks = [];

tasks.push(callback => {
  callback(null, 'a', 'b');
});

tasks.push((a, b, callback) => {
  callback(null, a, b, 'c');
});

waterfall(tasks, (err, a, b, c) => {
  // err === null, a === 'a', b === 'b', c === 'c'
});
```

## Returning an Error

```js
const waterfall = require('conjure-core/modules/async/waterfall');

const tasks = [];

tasks.push(callback => {
  callback(new Error('something happened'));
});

tasks.push((a, b, callback) => {
  // this will never be executed
  callback(null, a, b, 'c');
});

waterfall(tasks, (err, a, b, c) => {
  // err === Error instance, a === undefined, b === undefined, c === undefined
});
```

## Breaking Gracefully

```js
const waterfall = require('conjure-core/modules/async/waterfall');

const tasks = [];

tasks.push((callback, breakFlow) => {
  // callback not called - and all args passed to `breakFlow` are returned to waterfall handler
  breakFlow('x', 'y', 'z');
});

tasks.push((a, b, callback) => {
  // this will never be executed
  callback(null, a, b, 'c');
});

waterfall(tasks, (err, a, b, c) => {
  // err === null, a === 'x', b === 'y', c === 'z'
});
```
