const { ContentError } = require('../../err');

/*

  Promise.all([]) runs all promises in parallel
  This module does the same, but runs batches, as set, instead
  e.g. (3, [...]) will run the first 3 promises in parallel, then the next 3, etc

  `baseData` is an array of data. This array will be iterated over and each cell
  will be passed to `generatePromise`

  `generatePromise` must be a function that return promises (not the promises directly)
  this helps avoid promises firing immediately all in parallel (since that is what they do)

  this function returns the result of each promise resolve, in same order as inbound `baseData`
*/
module.exports = async (batchLimit, baseData, generatePromise) => {
  if (isNaN(batchLimit) || batchLimit < 1) {
    throw new ContentError('Invalid batch limit set');
  }

  const result = [];

  // iterate based on batchLimit
  for (let i = 0; i < baseData.length; i += batchLimit) {
    const pending = [];
    const pendingCount = Math.min(i + batchLimit, baseData.length - 1);

    // push in all promises in this batch
    for (let j = i; j < pendingCount; j++) {
      pending.push(generatePromise(baseData[j]));
    }

    // wait all promises in this batch to clear
    for (let j = 0; j < pendingCount; j++) {
      result[i + j] = await pending[j];
    }
  }

  return result;
};
