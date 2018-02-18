const kue = require('kue');
const config = require('../../modules/config');
const log = require('../../modules/log')('Queue');

class Queue {
  constructor(type) {
    this.queue = kue.createQueue({
      prefix: config.redis.queue.prefix,
      redis: {
        port: config.redis.port,
        host: config.redis.host,
        auth: config.redis.auth
      },
      jobEvents: false
    });
    this.type = type;
  }

  // to queue a job
  push(attributes = {}, priority = 'low') {
    return new Promise(resolve, reject) => {
      const unitsOfTime = require('../../modules/unitsOfTime');

      this.queue
        .create(this.type, attributes)
        .priority(priority) // see https://github.com/Automattic/kue#job-priority
        .attempts(3)
        .backoff({
          type: 'exponential'
        })
        .ttl(unitsOfTime.hour)
        .removeOnComplete(true)
        .save(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });

      this.queue.on('errror', err => {
        log.error(err);
      });
    });
  }

  subscribe(handler, parallelCount = 1) {
    this.queue.process(this.type, parallelCount, handler);
  }
}

module.exports = Queue;
