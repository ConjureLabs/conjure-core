const BeeQueue = require('bee-queue');
const config = require('../../modules/config');
const log = require('../../modules/log')('Queue');

class Queue {
  constructor(type, isWorker = false) {
    this.queue = new BeeQueue(type, {
      redis: config.redis,
      isWorker
    });
    this.type = type;
  }

  // to queue a job
  // `grouping` is a required string, that should be unique to the branch & PR combination
  // it is used to track pending jobs, so we can clear them as needed
  push(grouping, attributes = {}, priority = 'normal') {
    return new Promise(resolve, reject) => {
      const unitsOfTime = require('../../modules/unitsOfTime');

      this.queue
        .createJob(attributes)
        .retries(3)
        .backoff('exponential', unitsOfTime.second * 2)
        .timeout(unitsOfTime.hour)
        .removeOnSuccess(true)
        .removeOnFailure(true)
        .save(err => {
          if (err) {
            return reject(err);
          }
          resolve();
        });

      this.queue.on('errror', err => {
        log.error(err);
      });

      this.queue.on('retrying', (job, err) => {
        log.info(`job ${job.id} is retrying - err message of "${err.message}"`);
      });
    });
  }

  subscribe(handler, parallelCount = 1) {
    this.queue.process(parallelCount, handler);
  }
}

module.exports = Queue;
