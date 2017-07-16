class ReqProxy {
  constructor(options) {
    options = options || {};

    const config = require('conjure-core/modules/config');

    this.host = options.domain || config.app.api.publicDomain;
    this.protocol = options.protocol || config.app.api.protocol;
    this.path = options.path || '';
    this.method = typeof options.method === 'string' ? options.method.toUpperCase() : 'GET';
    this.encoding = options.encoding || 'utf8';
  }

  forward(req, res) {
    const request = require('request');
    request(`${this.protocol}://${this.domain}:${this.port}${this.path}`).pipe(res);
  }
}

module.exports = ReqProxy;
