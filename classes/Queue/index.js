const BeeQueue = require('bee-queue')
const { UnexpectedError } = require('@conjurelabs/err')
const config = require('../../modules/config')
const log = require('../../modules/log')('Queue')

class Queue {
  constructor(type, isWorker = false) {
    this.queue = new BeeQueue(type, {
      redis: config.redis,
      isWorker,
      removeOnSuccess: true,
      removeOnFailure: true
    })
    this.type = type
  }

  // to queue a job
  // `grouping` is a required string, that should be unique to the branch & PR combination
  // it is used to track pending jobs, so we can clear them as needed
  push(attributes) {
    return new Promise((resolve, reject) => {
      const unitsOfTime = require('../../modules/unitsOfTime')

      this.queue
        .createJob(attributes)
        .retries(3)
        .backoff('exponential', unitsOfTime.second * 2)
        .timeout(unitsOfTime.hour)
        .save(err => {
          if (err) {
            return reject(err)
          }
          resolve()
        })

      this.queue.on('error', err => {
        log.error(err)
      })

      this.queue.on('retrying', (job, err) => {
        log.info(`job ${job.id} is retrying - err message of "${err.message}"`)
      })
    })
  }

  subscribe(handler, parallelCount = 1) {
    this.queue.process(parallelCount, (job, done) => {
      let isDone = false
      let doneArgs
      try {
        handler(job.data, function(...args) {
          isDone = true
          doneArgs = args
        })
      } catch(err) {
        return done(err)
      }

      if (isSuccess) {
        done(...doneArgs)
      } else {
        done(new UnexpectedError('Queue job did not call done()'))
      }
    })
  }
}

module.exports = Queue
