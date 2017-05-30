// using a proxy to waterfallWorker to avoid arg exposure
module.exports = function waterfall(arr, callback) {
  waterfallWorker(arr, [], callback);
};

function waterfallWorker(arr, args, callback) {
  const step = arr.shift();

  if (step === undefined) {
    return callback(null, ...args);
  }

  // normal waterfall callback
  function stepCallback(err, ...newArgs) {
    if (err) {
      return callback(err);
    }

    waterfallWorker(arr, newArgs, callback);
  }

  // break waterfall
  function breakWaterfall(...newArgs) {
    return callback(null, ...newArgs);
  }

  step(...args, stepCallback, breakWaterfall);
}
