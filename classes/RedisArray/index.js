const redis = require('redis');
const config = require('../../modules/config');
const log = require('../../modules/log')('redis queue');
const { promisify } = require('util');

// const getAsync = promisify(client.get).bind(client);

const redisClient = redis.createClient(config.redis);

const lpop = promisify(redisClient.lpop).bind(redisClient);
const rpop = promisify(redisClient.rpop).bind(redisClient);
const lrange = promisify(redisClient.lrange).bind(redisClient);

redisClient.on('error', err => {
  log.error(err);
});

class RedisArray {
  constructor(name) {
    this.name = name;
  }

  push(str) {
    redisClient.rpush(this.name, str);
    return this;
  }

  unshift(str) {
    redisClient.lpush(this.name, str);
    return this;
  }

  async shift() {
    const str = await lpop(this.name);
    return str;
  }

  async pop() {
    const str = await rpop(this.name);
    return str;
  }

  async slice(start = 0, end = -1) {
    const slice = await lrange(this.name, start, end);
    return slice;
  }
}

module.exports = RedisArray;
