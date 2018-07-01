const { test } = require('ava')

const exec = require('../../../modules/childProcess/exec')

test('should echo', async t => {
  const echo = await exec('echo "This is Via a Test" && exit 0')
  t.is(echo, 'This is Via a Test')
})

test('should return stderr if needed', async t => {
  const path = require('path')
  let awaitErr
  try {
    await exec('bash ./bash-error.sh', {
      cwd: path.resolve(__dirname)
    })
  } catch(err) {
    awaitErr = err
  }
  t.true(awaitErr instanceof Error)
})
