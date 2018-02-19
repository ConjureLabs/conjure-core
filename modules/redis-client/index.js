const redis = require('redis');
const config = require('../config');
const log = require('../log')('redis');

const redisClient = redis.createClient(config.redis);

redisClient.on('error', err => {
  log.error(err);
});

module.exports = redisClient;
