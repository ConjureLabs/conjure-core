'use strict';

const appRoot = require('app-root-path');
const log = require(`${appRoot}/modules/log`)('child process execution');

module.exports = (command, options, callback) => {
  const exec = require('child_process').exec;

  // todo: logging for debug, for now, but should supress this in non-dev
  log.info(command);

  exec(command, options, (err, stdout, stderr) => {
    if (err) {
      return callback(err);
    }

    if (stderr) {
      return callback(new Error(stderr));
    }

    // // keeping these commented lines to help debug, when needed
    // if (stdout) {
    //   console.log(stdout);
    // }

    callback(null, typeof stdout === 'string' ? stdout.trim() : '');
  });
};
