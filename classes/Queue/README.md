# Queue Class

This class works with RabbitMQ. It could work with any AMQP, probably.

## Setup

The constructor takes three arguments; `exchangeNameArg`, `queueNameArg` and `routingKeyArg`.

See [the RabbitMQ concepts docs](https://www.rabbitmq.com/tutorials/amqp-concepts.html) for more on each.

var | purpose | library docs
--- | --- | ---
`exchangeNameArg` | The name of the exchange to use | [link](https://github.com/postwait/node-amqp#exchange)
`queueNameArg` | The name of the queue to use | [link](https://github.com/postwait/node-amqp#queue)
`routingKeyArg` | The dot-notated topic path | [link](https://github.com/postwait/node-amqp#exchangepublishroutingkey-message-options-callback)

The `routingKeyArg` is dot-notated, and can have wildcards.

`food.dinner.pizza` can be published, then a listener could subscribe to `food.dinner.pizza`, `food.dinner.*`, `food.*`, or `*`.

But, if you changed it to `food.italian.dinner.pizza` then only `food.*` and `*` would continue to subscribe correctly.

## Usage

### Publishing messages

```js
const Queue = require('conjure-core/classes/Queue');

const queue = new Queue('exch', 'foodQueue', 'food.dinner.pizza');

await queue.publish({
  id: 123
});
```

### Subscribing

```js
const Queue = require('conjure-core/classes/Queue');

// will subscribe to `food.dinner.pizza` and _all other_ `food.dinner`s
const queue = new Queue('exch', 'foodQueue', 'food.dinner.*');

/*
  `.subscribe` will fire when a message is received
  This is not called once
  After initial subscription or after any `message.done()` another message can come in
  Messages come in one at a time.
 */
queue.subscribe(message => {
  if (err) {
    throw err;
  }

  const content = message.body;

  console.log(content);

  message.done(); // removes it from the queue, move to next task
});
```
