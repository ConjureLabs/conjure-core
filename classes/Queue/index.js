const log = require('../../modules/log')('Queue');

let gettingConnection = false;
const pendingConnections = []; // each cell is { resolve: [Function], reject: [Function] }
function getConnection() {
  return new Promise((resolve, reject) => {
    pendingConnectionResolves.push({
      resolve,
      reject
    });

    if (gettingConnection === true) {
      return;
    }
    gettingConnection = true;

    const amqp = require('amqp');
    const log = require('../../modules/log')('MQ');
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
      // override connection methods to promisify them
      const originalExchange = connection.exchange;
      connection.exchange = (name, options) => {
        return new Promise(resolve => {
          originalExchange(name, options, exchange => {
            // override exchange methods as needed, to promisify
            const originalPublish = exchange.publish;
            exchange.publish = (key, message, options) => {
              return new Promise((resolve, reject) => {
                originalPublish(key, message, options, err => {
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
            };

            resolve(exchange);
          });
        });
      };

      const originalQueue = connection.queue;
      connection.queue = (name, options) => {
        return new Promise(resolve => {
          originalQueue(name, options, queue => {
            // override queue methods as needed, to promisfy
            const originalSubscribe = queue.subscribe;
            queue.subscribe = options => {
              return new Promise((resolve) => {
                originalSubscribe(options, (message, headers, deliveryInfo, ack) => {
                  resolve({
                    message,
                    headers,
                    deliveryInfo,
                    ack
                  });
                });
              });
            };

            resolve(queue);
          });
        });
      };

      // any future calls to .getConnection() will immediately resolve
      getConnection = () => {
        return new Promise(resolve => {
          resolve(connection);
        });
      };

      // process all pending promises
      for (let i = 0; i < pendingConnections.length; i++) {
        pendingConnections[i].resolve(connection);
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

  async subscribeOnce() {
    log.info(`subscribing to ${this[routingKey]}`);
    const { queue } = await this[onQueueReady]();

    // see https://github.com/postwait/node-amqp#queuesubscribeoptions-listener
    const { message, ack } = await queue.subscribe({
      ack: true
    });

    return new Message(message, ack);
  }

  async subscribe() {
    const message = await this.subscribeOnce();
    // override .ack() to trigger another subscribe
    const originalAck = message.ack.bind(message);
    message.ack = () => {
      originalAck();
      this.subscribe();
    };
    return message;
  }
}

class Message {
  constructor(rawMessage, rawAck) {
    this.body = rawMessage;
    this.rawAck = rawAck;
  }

  ack() {
    this.rawAck.acknowledge();
    return this;
  }
}

module.exports = Queue;
