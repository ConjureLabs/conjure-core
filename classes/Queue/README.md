# Queue Class

This class works with [Kue](https://github.com/Automattic/kue).

## Usage

### Publishing jobs

```js
const Queue = require('conjure-core/classes/Queue');

const queue = new Queue('email');

// attributes can be anything
await queue.push({
  email: 'tim@conjure.sh',
  subject: 'howdy',
  body: 'this is an example'
});
```

### Subscribing

```js
const Queue = require('conjure-core/classes/Queue');

const queue = new Queue('email');

queue.subscribe(async job => {
  // job.data contains the attributes sent in .push()

  // job.failure(err) if any problems

  job.success(); // acks and moves on
});
```

You can subscribe to multiple in parallel. By default it will only process one at a time.

```js
const Queue = require('conjure-core/classes/Queue');

const queue = new Queue('email');

queue.subscribe(async job => {
  // ...
  job.success();
}, 10); // 10 at a time
```
