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
      pendingConnectionCallbacks[i](null, connection);
    }
  });
}

const pendingQueueReady = Symbol('pending queue ready');
class Queue {
  // see https://github.com/postwait/node-amqp#connectionqueuename-options-opencallback for options
  constructor(name, options) {
    this[pendingQueueReady] = [];

    getConnection(connection => {
      connection.queue(name, options, queue => {
        this.onQueueReady = callback => callback(null, queue);

        for (let i = 0; i < this[pendingQueueReady].length; i++) {
          this[pendingQueueReady](null, queue);
        }

        this[pendingQueueReady] = null;
      });
    });
  }

  // will be replaced with a direct callback call when queue is ready
  onQueueReady(callback) => {
    this[pendingQueueReady].push(callback);
  }

  publish(routingKey, body, callback) {
    // when queue is ready, so should be the connection
    this.onQueueReady(err => {
      if (err) {
        // todo: what to do here?
        throw err;
      }

      // see https://github.com/postwait/node-amqp#exchangepublishroutingkey-message-options-callback for options
      this.connection.publish(routingKey, body, {
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
    this.onQueueReady((err, queue) => {
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

  done() {
    this.rawAck.acknowledge();
  }
}

module.exports = Queue;
