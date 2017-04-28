'use strict';

const log = require('../../modules/log')('container update');

function containerUpdate(callback) {
  log.info('starting update');

  // there is a better way to do this - for now, keeping it rather simple
  const async = require('async');
  async.series([
    this.destroy,
    this.create
  ], err => {
    callback(err);
  });
}

module.exports = containerUpdate;
