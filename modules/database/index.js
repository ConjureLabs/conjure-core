const pgPool = require('pg').Pool;
const appRoot = require('app-root-path');
const config = require(`${appRoot}/modules/config`);
const log = require(`${appRoot}/modules/log`)('database');

const pool = new pgPool(config.database.pg);

// todo: deal with client (err, client) that caused the err?
pool.on('error', err => {
  log.error(err);
});

function query(/* query, [queryArgs], callback */) {
  const args = Array.prototype.slice.call(arguments);
  let callback = args.pop();

  if (typeof callback !== 'function') {
    throw new Error('Expected last argument to query() to be a callback');
  }

  pool.connect((err, client, done) => {
    if (err) {
      return callback(err);
    }

    // forcing `done()` to be called whenever a query returns
    args.push(function queryCallback() {
      done();
      callback.apply(callback, arguments);
    });

    // todo: make the log require (at top) different between errors & this
    // so DEBUG can be set on prod to *not* output sql
    log.info(args[0] /* sql */, args[1] /* placeholder values */);
    client.query.apply(client, args);
  });
}

module.exports.query = query;
