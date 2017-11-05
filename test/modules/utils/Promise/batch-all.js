const { test } = require('ava');

const batchAll = require('../../../../modules/utils/Promise/batch-all');

test('should return batch results', async t => {
  const exampleData = ['dog', 'cat', 'owl', 'coyote', 'bear', 'wolf', 'fox', 'eagle', 'shark', 'snake', 'tiger'];
  const results = await batchAll(3, exampleData, animal => {
    return new Promise((resolve, reject) => {
      resolve(`resolved ${animal}`);
    });
  });

  for (let i = 0; i < exampleData.length; i++) {
    t.is(results[i], `resolved ${exampleData[i]}`);
  }
});
