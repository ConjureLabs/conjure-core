const ConjureError = require('conjure-core/modules/err').ConjureError;

const log = require('conjure-core/modules/log')('child process execution');

module.exports = (command, options, callback) => {
  const exec = require('child_process').exec;

  log.dev.info(command);

  exec(command, options, (err, stdout, stderr) => {
    if (err) {
      return callback(err);
    }

    if (stderr) {
      return callback(new ConjureError(stderr));
    }

    // // keeping these commented lines to help debug, when needed
    // if (stdout) {
    //   console.log(stdout);
    // }

    callback(null, typeof stdout === 'string' ? stdout.trim() : '');
  });
};
