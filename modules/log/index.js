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

  //if (process.env.NODE_ENV === 'development' || (typeof process.env.CONJURE_FORCE_ALL_LOGS === 'string' && process.env.CONJURE_FORCE_ALL_LOGS.length)) {
    methods.dev = Object.assign({}, methods);
    return methods;
  //}

  methods.dev = Object.keys(methods).reduce((noOps, key) => {
    noOps[key] = () => {};
    return noOps;
  }, {});

  return methods;
};
