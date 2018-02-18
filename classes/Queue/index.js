const kue = require('kue');
const config = require('../../modules/config');
const log = require('../../modules/log')('Queue');

class Queue {
  constructor() {
    this.queue = kue.createQueue({
      prefix: config.redis.queue.prefix,
      redis: {
        port: config.redis.port,
        host: config.redis.host,
        auth: config.redis.auth
      },
      jobEvents: false
    });
  }

  // to queue a job
  push(type, attributes = {}, priority = 'low') {
    const unitsOfTime = require('../../modules/unitsOfTime');

    this.queue
      .create(type, attributes)
      .priority(priority) // see https://github.com/Automattic/kue#job-priority
      .attempts(3)
      .backoff({
        type: 'exponential'
      })
      .ttl(unitsOfTime.hour)
      .removeOnComplete(true)
      .save();

    this.queue.on('errror', err => {
      log.error(err);
    });

    return this;
  }

  subscribe(type, parallelCount = 1) {
    return new Promise(resolve => {
      this.queue.process(type, (job, done) => {
        resolve({
          job,
          success: () => {
            done();
          },
          failure: err => {
            done(err);
          }
        });
      });
    });
  }
}

module.exports = Queue;
