const log = require('conjure-core/modules/log')('container destroy');

// todo: set up a module that handles cases like this
const asyncBreak = {};

function containerDestroy(callback) {
  log.info('starting destroy');

  const {
    branch
  } = this.payload;

  const waterfall = [];

  // get watched repo record
  waterfall.push(cb => {
    this.payload.getWatchedRepoRecord(cb);
  });

  // make sure the repo/branch is spun up
  waterfall.push((watchedRepo, cb) => {
    const DatabaseTable = require('conjure-core/classes/DatabaseTable');
    // todo: detect correct server host, but on develop / test keep localhost
    DatabaseTable.select('container', {
      repo: watchedRepo.id,
      branch: branch,
      is_active: true
    }, (err, records) => {
      if (err) {
        return cb(err);
      }

      if (!records.length) {
        return cb(asyncBreak);
      }

      cb(null, watchedRepo, records);
    });
  });

  // spin down vms
  waterfall.push((watchedRepo, runningContainerRecords, cb) => {
    const exec = require('conjure-core/modules/childProcess/exec');

    for (let i = 0; i < runningContainerRecords.length; i++) {
      const containerRecord = runningContainerRecords[i];

      // todo: handle non-github repos
      exec(`bash ./destroy.sh "${containerRecord.url_uid}" "${containerRecord.container_id}"`, {
        cwd: process.env.CONJURE_WORKER_DIR
      }, err => {
        if (err) {
          // can't kick to callback
          return log.error(err);
        }
      });
    }

    cb(null, watchedRepo);
  });

  // remove db reference to proxy
  waterfall.push((watchedRepo, cb) => {
    const DatabaseTable = require('conjure-core/classes/DatabaseTable');
    DatabaseTable.update('container', {
      is_active: false,
      active_stop: new Date()
    }, {
      repo: watchedRepo.id,
      branch: branch,
      is_active: true
    }, err => {
      cb(err);
    });
  });

  const async = require('async');
  async.waterfall(waterfall, err => {
    if (err === asyncBreak) {
      return callback();
    }

    callback(err);
  });
}

module.exports = containerDestroy;
