const labelSeparator = ' --> ';

module.exports = label => {
  const labelUsing = `${label || 'Conjure'}${labelSeparator}`;

  const methods = {
    log: console.log.bind(console.log, labelUsing),
    info: console.info.bind(console.info, labelUsing),
    dir: console.dir.bind(console.dir, labelUsing),
    error: console.error.bind(console.error, labelUsing),
    timeStart: console.time.bind(console.time, labelUsing),
    timeEnd: console.time.bind(console.time, labelUsing)
  };

  if (process.env.NODE_ENV === 'development') {
    methods.dev = Object.assign({}, methods);
    return methods;
  }

  moethods.dev = Object.keys(moethods).reduce((noOps, key) => {
    noOps[key] = () => {};
    return noOps;
  }, {});

  return methods;
};
