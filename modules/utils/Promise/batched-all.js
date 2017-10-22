const { ContentError } = require('../../err');

// Promise.all([]) runs all promises in parallel
// This module does the same, but runs batches, as set, instead
// e.g. (3, [...]) will run the first 3 promises in parallel, then the next 3, etc
module.exports = async (batchLimit, promises) => {
  if (isNaN(batchLimit) || batchLimit < 1) {
    throw new ContentError('Invalid batch limit set');
  }

  // creating isolated batches
  const batches = promises.reduce((batches, promise) => {
    let currentBatch = batches[ batches.length - 1];

    if (currentbatch.length === batchLimit) {
      currentBatch = [];
      batches.push(currentBatch);
    }

    currentBatch.push(promise);
  }, [ [] ]);

  // run each batch
  for (let i = 0; i < batches.length; i++) {
    await Promise.all(batches[i]);
  }
};
