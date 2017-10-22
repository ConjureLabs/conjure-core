const { ContentError } = require('../../err');

/*

  Promise.all([]) runs all promises in parallel
  This module does the same, but runs batches, as set, instead
  e.g. (3, [...]) will run the first 3 promises in parallel, then the next 3, etc

  `pendingPromises` must be functions that return promises (not the promises directly)
  this helps avoid promises firing immediately all in parallel (since that is what they do)
*/
module.exports = async (batchLimit, pendingPromises) => {
  if (isNaN(batchLimit) || batchLimit < 1) {
    throw new ContentError('Invalid batch limit set');
  }

  // iterate based on batchLimit
  for (let i = 0; i < pendingPromises.length; i += batchLimit) {
    const pending = [];
    const pendingCount = Math.min(i + batchLimit, repos.length - 1);

    // push in all promises in this batch
    for (let j = i; j < pendingCount; j++) {
      pending.push(pendingPromises[j]());
    }

    // wait all promises in this batch to clear
    for (let j = 0; j < pendingCount; j++) {
      await pending[j];
    }
  }
};
