class ReqProxy {
  constructor(options) {
    options = options || {};

    const config = require('conjure-core/modules/config');

    this.host = options.host || config.app.api.publicHost;
    this.protocol = options.protocol || 'http';
    this.port = options.port || config.app.api.port;
    this.path = options.path || '';
    this.method = typeof options.method === 'string' ? options.method.toUpperCase() : 'GET';
    this.encoding = options.encoding || 'utf8';
  }

  forward(req, res) {
    const request = require('request');
    request(`${this.protocol}://${this.host}:${this.port}${this.path}`).pipe(res);
  }
}

module.exports = ReqProxy;
