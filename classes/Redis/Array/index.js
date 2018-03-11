const { promisify } = require('util')

const redisClient = require('../../../modules/redis-client')

const lpop = promisify(redisClient.lpop).bind(redisClient)
const rpop = promisify(redisClient.rpop).bind(redisClient)
const lrange = promisify(redisClient.lrange).bind(redisClient)

class RedisArray {
  constructor(name) {
    this.name = name
  }

  push(str) {
    redisClient.rpush(this.name, str)
    return this
  }

  unshift(str) {
    redisClient.lpush(this.name, str)
    return this
  }

  async shift() {
    const str = await lpop(this.name)
    return str
  }

  async pop() {
    const str = await rpop(this.name)
    return str
  }

  async slice(start = 0, end = -1) {
    const slice = await lrange(this.name, start, end)
    return slice
  }
}

module.exports = RedisArray
