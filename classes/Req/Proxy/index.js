class ReqProxy {
  constructor(options) {
    options = options || {}

    const config = require('../../../modules/config')

    this.domain = options.domain !== undefined ? options.domain : config.app.api.publicDomain
    this.protocol = options.protocol !== undefined ? options.protocol : config.app.api.protocol
    this.path = options.path !== undefined ? options.path : ''
    this.method = typeof options.method === 'string' ? options.method.toUpperCase() : 'GET'
    this.encoding = options.encoding !== undefined ? options.encoding : 'utf8'
    this.port = options.port !== undefined ? options.port : null

    this.forward = this.forward.bind(this)
  }

  forward(req, res, next) {
    const fullUrl = `${this.protocol}://${this.domain}${this.port ? `:${this.port}` : ''}${this.path}`
    const request = require('request')

    // first pinging to make sure it won't crash
    request({
      url: fullUrl,
      method: 'HEAD'
    }, err => {
      if (err) {
        return next(err)
      }

      request(fullUrl).pipe(res)
    })
  }
}

module.exports = ReqProxy
