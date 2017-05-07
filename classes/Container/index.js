'use strict';

class Container {
  constructor(payloadInstance) {
    this.payload = payloadInstance;
  }

  create(callback) {
    require('./create')(callback);
  }

  destroy(callback) {
    require('./destroy')(callback);
  }

  update(callback) {
    require('./update')(callback);
  }
}

module.exports = Container;
