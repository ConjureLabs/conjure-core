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

  console.log(config);

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
      pendingConnectionCallbacks[i](null, connection);
    }
  });
}

const pendingQueueReady = Symbol('pending queue ready');
const onQueueReady = Symbol('on queue ready event');
class Queue {
  constructor(exchangeName, queueName) {
    this[pendingQueueReady] = [];

    getConnection((err, connection) => {
      if (err) {
        // todo: handle errs?
        throw err;
      }

      // see https://github.com/postwait/node-amqp#connectionexchangename-options-opencallback
      connection.exchange(exchangeName, {
        type: 'topic',
        passive: false,
        durable: true, // keep true to persist exchange
        autoDelete: false,
        noDeclare: false,
        confirm: true // causes exchange.publish to fire callback w/ failure bool
      }, exchange => {
        // see https://github.com/postwait/node-amqp#connectionqueuename-options-opencallback
        connection.queue(queueName, {
          passive: false,
          durable: true, // keep true to persist queue
          exclusive: false,
          autoDelete: false,
          noDeclare: false
        }, queue => {
          this[onQueueReady] = callback => callback(null, exchange, queue);

          for (let i = 0; i < this[pendingQueueReady].length; i++) {
            this[pendingQueueReady][i](null, exchange, queue);
          }

          this[pendingQueueReady] = null;
        });
      });
    });
  }

  // will be replaced with a direct callback call when queue is ready
  [onQueueReady](callback) {
    this[pendingQueueReady].push(callback);
  }

  publish(routingKey, message, callback = function() {}) {
    this[onQueueReady]((err, exchange) => {
      if (err) {
        return callback(err);
      }

      // see https://github.com/postwait/node-amqp#exchangepublishroutingkey-message-options-callback
      exchange.publish(routingKey, message, {
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
    this[onQueueReady]((err, _, queue) => {
      if (err) {
        return callback(err);
      }

      // see https://github.com/postwait/node-amqp#queuesubscribeoptions-listener
      queue.subscribe({
        ack: true,
        prefetchCount: 1
      }, (message, headers, deliveryInfo, ack) => {
        callback(null, new Message(message, ack));
      });
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
  }
}

module.exports = Queue;
