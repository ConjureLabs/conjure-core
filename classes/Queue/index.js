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
    getConnection = callback => callback(connection);

    // process all pending callbacks
    for (let i = 0; i < pendingConnectionCallbacks.length; i++) {
      pendingConnectionCallbacks[i](connection);
    }    
  });
}

class Queue {
  constructor() {
    
  }
}

module.exports = Queue;
