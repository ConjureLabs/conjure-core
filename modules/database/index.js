const pgPool = require('pg').Pool;
const config = require('conjure-core/modules/config');
const ContentError = require('conjure-core/modules/err').ContentError;
const log = require('conjure-core/modules/log')('database');

const pool = await new pgPool(config.database.pg);

async function query(...args) {
  const client = await pool.connect();

  log.dev.info(args[0] /* sql */, args[1] || [] /* placeholder values */);
  await.client.query(...args);

  client.release();
}

module.exports.query = query;
