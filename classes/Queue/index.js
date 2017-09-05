let gettingConnection = false;
const pendingConnectionCallbacks = [];

function getConnection(callback) {
  pendingConnectionCallbacks.push(callback);

  if (gettingConnection === true) {
    return;
  }
  gettingConnection = true;

  const amqp = require('amqp');
  const log = require('conjure-core/modules/log')('MQ');
  const config = require('conjure-core/modules/config').mq;

  const connection = amqp.createConnection(config);

  connection.on('error', err => {
    // todo: handle mq conn errors?
    log.error(err);
  });

  connection.on('ready', () => {
    // any future calls to .getConnection() will immediately have callback called
    getConnection = callback => callback(null, connection);

    // process all pending callbacks
    for (let i = 0; i < pendingConnectionCallbacks.length; i++) {
      const pending = pendingConnectionCallbacks.shift();
      pending(null, connection);
    }
  });
}

const onQueueReady = Symbol('on queue ready event');
const exchangeName = Symbol('exchange name');
const queueName = Symbol('queue name');
const routingKey = Symbol('routing key for queue messages');
class Queue {
  constructor(exchangeNameArg, queueNameArg, routingKeyArg) {
    this[exchangeName] = exchangeNameArg;
    this[queueName] = queueNameArg;
    this[routingKey] = routingKeyArg;
  }

  [onQueueReady](callback) {
    getConnection((err, connection) => {
      if (err) {
        return callback(err);
      }

      // see https://github.com/postwait/node-amqp#connectionexchangename-options-opencallback
      connection.exchange(this[exchangeName], {
        type: 'topic',
        passive: false,
        durable: true, // keep true to persist exchange
        autoDelete: false,
        noDeclare: false,
        confirm: true // causes exchange.publish to fire callback w/ failure bool
      }, exchange => {
        // see https://github.com/postwait/node-amqp#connectionqueuename-options-opencallback
        connection.queue(this[queueName], {
          passive: false,
          durable: true, // keep true to persist queue
          exclusive: false,
          autoDelete: false,
          noDeclare: false
        }, queue => {
          queue.bind(this[exchangeName], this[routingKey]);
          callback(null, exchange, queue);
        });
      });
    });

    return this;
  }

  publish(message, callback = function() {}) {
    return this[onQueueReady]((err, exchange) => {
      if (err) {
        return callback(err);
      }

      // see https://github.com/postwait/node-amqp#exchangepublishroutingkey-message-options-callback
      exchange.publish(this[routingKey], message, {
        mandatory: true,
        deliveryMode: 2, // persistent
        priority: 1, // todo: make priority adjustable?
      }, err => {
        if (err instanceof Error) {
          return callback(err);
        } else if (err === true) {
          const UnexpectedError = require('conjure-core/modules/err').UnexpectedError;
          return callback(new UnexpectedError('An error occurred while publishing message to queue'));
        }

        callback();
      });
    });
  }

  subscribe(callback) {
    return this[onQueueReady]((err, _, queue) => {
      if (err) {
        return callback(err);
      }

      // see https://github.com/postwait/node-amqp#queuesubscribeoptions-listener
      queue.subscribe({
        ack: true
      }, (message, headers, deliveryInfo, ack) => callback(null, new Message(message, ack)));
    });
  }
}

class Message {
  constructor(rawMessage, rawAck) {
    this.data = rawMessage;
    this.rawAck = rawAck;
  }

  ack() {
    this.rawAck.acknowledge();
    return this;
  }
}

module.exports = Queue;
