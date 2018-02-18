# Queue Class

This class works with [Bee-Queue](https://github.com/bee-queue/bee-queue).

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

queue.subscribe(job => {
  // job.data contains the attributes sent in .push()

  // job.failure(err) if any problems

  job.success(); // acks and moves on
});
```

You can subscribe to multiple in parallel. By default it will only process one at a time.

```js
const Queue = require('conjure-core/classes/Queue');

const queue = new Queue('email');

queue.subscribe(job => {
  // ...
  job.success();
}, 10); // 10 at a time
```

### Workers

Any workers need to pass `true` to the queue, which [adds extra connections](https://github.com/bee-queue/bee-queue#under-the-hood).

```js
const Queue = require('conjure-core/classes/Queue');

const workerQueue = new Queue('email', true);
```
