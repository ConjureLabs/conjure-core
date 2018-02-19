const { promisify } = require('util');

const redisClient = require('../../../modules/redis-client');

const hget = promisify(redisClient.hget).bind(redisClient);

class RedisCounter {
  constructor(hashName, counterName) {
    this.hashName = hashName;
    this.counterName = counterName;
  }

  set(num) {
    redisClient.hset(this.hashName, this.counterName, num);
    return this;
  }

  increment(by = 1) {
    redisClient.hincrby(this.hashName, this.counterName, by);
    return this;
  }

  decrement(by = 1) {
    redisClient.hincrby(this.hashName, this.counterName, -by);
    return this;
  }

  async get() {
    const num = await hget(this.hashName, this.counterName);
    return num || 0;
  }
}

module.exports = RedisCounter;
