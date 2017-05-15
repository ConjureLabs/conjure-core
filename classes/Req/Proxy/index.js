class ReqProxy {
  constructor(options) {
    options = options || {};

    const appRoot = require('app-root-path');
    const config = require(`${appRoot}/modules/config`);

    this.host = options.host || config.app.publicHost;
    this.protocol = options.protocol || 'http';
    this.port = options.port || config.app.port;
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
