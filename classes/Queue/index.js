const log = require('../../modules/log')('Queue');

function promisifyConnection(connection) {
  // override connection methods to promisify them
  return {
    on: connection.on,
    exchange: (name, options) => {
      return new Promise(resolve => {
        connection.exchange(name, options, realExchange => {
          resolve(promisifyExchange(realExchange));
        });
      });
    },
    queue: (name, options) => {
      return new Promise(resolve => {
        connection.queue(name, options, realQueue => {
          resolve(realQueue);
        });
      });
    }
  };
}

function promisifyExchange(exchange) {
  // override exchange methods as needed, to promisify
  return {
    publish: (key, message, options) => {
      return new Promise((resolve, reject) => {
        exchange.publish(key, message, options, err => {
          if (err instanceof Error) {
            reject(err);
          } else if (err === true) {
            const { UnexpectedError } = require('../../modules/err');
            reject(new UnexpectedError('An error occurred while publishing message to queue'));
          } else {
            resolve();
          }
        });
      });
    }
  };
}

let gettingConnection = false;
const pendingConnections = []; // each cell is { resolve: [Function], reject: [Function] }
function getConnection() {
  return new Promise((resolve, reject) => {
    pendingConnections.push({
      resolve,
      reject
    });

    if (gettingConnection === true) {
      return;
    }
    gettingConnection = true;

    const amqp = require('amqp');
    const { mq:config } = require('../../modules/config');

    const connection = amqp.createConnection(config);

    connection.on('error', err => {
      // todo: attempt recovery, or throw?
      // any future call to .getConnection() will immediately reject
      getConnection = () => {
        return new Promise((resolve, reject) => {
          reject(err);
        });
      };
      for (let i = 0; i < pendingConnections.length; i++) {
        pendingConnections[i].reject(err);
      }
    });

    connection.on('ready', () => {
      const promisifiedConnection = promisifyConnection(connection);

      // any future calls to .getConnection() will immediately resolve
      getConnection = () => {
        return new Promise(resolve => {
          resolve(promisifiedConnection);
        });
      };

      // process all pending promises
      for (let i = 0; i < pendingConnections.length; i++) {
        pendingConnections[i].resolve(promisifiedConnection);
      }
    });
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

  async [onQueueReady]() {
    const connection = await getConnection();
    const exchange = await connection.exchange(this[exchangeName], {
      type: 'topic',
      passive: false,
      durable: true, // keep true to persist exchange
      autoDelete: false,
      noDeclare: false,
      confirm: true // causes exchange.publish to fire callback w/ failure bool
    });
    const queue = await connection.queue(this[queueName], {
      passive: false,
      durable: true, // keep true to persist queue
      exclusive: false,
      autoDelete: false,
      noDeclare: false
    });

    return {
      exchange,
      queue
    };
  }

  async publish(message) {
    const { exchange } = await this[onQueueReady]();

    // see https://github.com/postwait/node-amqp#exchangepublishroutingkey-message-options-callback
    log.info(`publishing to exchange: ${this[routingKey]}`);
    await exchange.publish(this[routingKey], message, {
      mandatory: true,
      deliveryMode: 2, // persistent
      priority: 1 // todo: make priority adjustable?
    });
  }

  async subscribe(handler) {
    log.info(`subscribing to ${this[routingKey]}`);
    const { queue } = await this[onQueueReady]();

    queue.subscribe({
      ack: true,
      prefetchCount: 1
    }, (message, headers, deliveryInfo, messageObject) => {
      handler(new Message(queue, message, messageObject));
    });
  }
}

class Message {
  constructor(queue, rawMessage, messageObject) {
    this.queue = queue;
    this.body = rawMessage;
    this.rawAck = messageObject.acknowledge.bind(messageObject);
  }

  done() {
    this.rawAck(false);
    this.queue.shift();
    return this;
  }
}

module.exports = Queue;
