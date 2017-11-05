const { test } = require('ava');

const exec = require('../../../modules/childProcess/exec');

test.cb('should echo', t => {
  exec('echo "This is Via a Test"', {}, (err, out) => {
    const expected = !err && out === 'This is Via a Test';
    t.end(!expected); // passing inverse to signal no error
  });
});

test.cb('should honor cwd', t => {
  const path = require('path');
  exec('cat ./contents.txt', {
    cwd: path.resolve(__dirname, 'path', 'test')
  }, (err, out) => {
    const expected = !err && out === 'Dark Forest';
    t.end(!expected); // passing inverse to signal no error
  });
});

test.cb('should return stderr if needed', t => {
  const path = require('path');
  exec('bash ./bash-error.sh', {
    cwd: path.resolve(__dirname)
  }, err => {
    const expected = err;
    t.end(!expected); // passing inverse to signal no error
  });
});
