const { test } = require('ava');

const exec = require('../../../modules/childProcess/exec');

test('should echo', async t => {
  const echo = await exec('echo "This is Via a Test"');
  t.is(echo, 'This is Via a Test');
});

test('should honor cwd', async t => {
  const path = require('path');
  const content = await exec('cat ./contents.txt', {
    cwd: path.resolve(__dirname, 'path', 'test')
  });
  t.is(content, 'Dark Forest');
});

test('should return stderr if needed', async t => {
  const path = require('path');
  let awaitErr;
  try {
    await exec('bash ./bash-error.sh', {
      cwd: path.resolve(__dirname)
    });
  } catch(err) {
    awaitErr = err;
  }
  t.true(awaitErr instanceof Error);
});
