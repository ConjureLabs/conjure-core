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

  const data = baseData.slice();
  const result = [];

  while (data.length) {
    const currentRun = [];

    for (let i = 0; i < Math.min(batchLimit, data.length); i++) {
      currentRun.push(
        generatePromise(
          data.shift()
        )
      );
    }

    for (let i = 0; i < currentRun.length; i++) {
      result.push( await currentRun[i] );
    }
  }

  return result;
};
