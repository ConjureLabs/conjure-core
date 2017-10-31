const { Pool } = require('pg');
const config = require('../config');
const { ContentError } = require('../err');
const log = require('../log')('database');

const pool = new pgPool(config.database.pg);

async function query(...args) {
  const client = await pool.connect();

  log.dev.info(args[0] /* sql */, args[1] || [] /* placeholder values */);
  const result = await client.query(...args);

  client.release();

  return result;
}

module.exports.query = query;
