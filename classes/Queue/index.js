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

  async removeAll() {
    // first clear all pending, ensure they don't bump into active
    await cacelAllJobsByState(this.type, 'inactive');
    // now clear active jobs
    await cacelAllJobsByState(this.type, 'active');
  }
}

function cacelAllJobsByState(type, state) {
  return new Promise(async (resolve, reject) => {
    const batchSize = 20;
    let canceledCount = 0;

    do {
      let batchResults;

      try {
        batchResults = await cancelJobsByStateBatch(type, state, batchSize);
      } catch(err) {
        return reject(err);
      }

      canceledCount = batchResults.length;
    } while (canceledCount === batchSize);

    resolve();
  });
}

function cancelJobsByStateBatch(type, state, batchSize) {
  return new Promise((resolve, reject) => {
    kue.Job.rangeByType(type, state, 0, batchSize, 'asc', async (err, jobs) => {
      if (err) {
        return reject(err);
      }

      Promise
        .all(jobs.map(job => cancelIndividualJob(job)))
        .then(resolve)
        .catch(reject);
    });
  });
}

function cancelIndividualJob(job) {
  return new Promise((resolve, reject) => {
    job.remove(err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

module.exports = Queue;
