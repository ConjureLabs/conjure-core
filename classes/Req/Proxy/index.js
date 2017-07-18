class ReqProxy {
  constructor(options) {
    options = options || {};

    const config = require('conjure-core/modules/config');

    this.domain = options.domain !== undefined ? options.domain : config.app.api.publicDomain;
    this.protocol = options.protocol !== undefined ? options.protocol : config.app.api.protocol;
    this.path = options.path !== undefined ? options.path : '';
    this.method = typeof options.method === 'string' ? options.method.toUpperCase() : 'GET';
    this.encoding = options.encoding !== undefined ? options.encoding : 'utf8';
    this.port = options.port !== undefined ? options.port : null;

    this.forward = this.forward.bind(this);
  }

  forward(req, res) {
    const request = require('request');
    request(`${this.protocol}://${this.domain}${this.port ? `:${this.port}` : ''}${this.path}`).pipe(res);
  }
}

module.exports = ReqProxy;
