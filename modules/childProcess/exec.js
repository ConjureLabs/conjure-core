const { ConjureError } = require('conjure-core/modules/err');

const log = require('conjure-core/modules/log')('child process execution');

module.exports = (command, options) => {
  return new Promise((resolve, reject) => {
    const exec = require('child_process').exec;

    log.dev.info(command);

    exec(command, options, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }

      if (stderr) {
        return reject(new ConjureError(stderr));
      }

      // // keeping these commented lines to help debug, when needed
      // if (stdout) {
      //   console.log(stdout);
      // }

      resolve(typeof stdout === 'string' ? stdout.trim() : '');
    });
  });
};
