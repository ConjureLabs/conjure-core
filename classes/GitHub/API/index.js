const { ConjureError } = require('@conjurelabs/err')
const request = require('request')

const leadingSlash = /^\//

class API {
  constructor({ headers = {} }) {
    this.headers = {
      'User-Agent': 'Conjure (https://conjure.sh)',
      Accept: 'application/vnd.github.machine-man-preview+json',
      ...headers
    }
  }

  // returns a promise, so you can await
  request({
    path,
    method = 'GET',
    ...opts
  }) {
    return new Promise((resolve, reject) => {
      const pathPrepared = path.replace(leadingSlash, '')
      request({
        url: `https://api.github.com/${pathPrepared}`,
        method,
        headers: this.headers,
        json: true,
        ...opts
      }, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        // ensuring it's a 2xx code
        const isTwoHundreds = Math.floor(+res.statusCode / 100) === 2
        if (!isTwoHundreds) {
          /*
            e.g.
            { message: 'Not Found',
              documentation_url: 'https://developer.github.com/v3' }
           */
          let message = body.message || `Github returned code ${res.statusCode} (/${pathPrepared})`
          message = message === 'Not Found' ? `Not Found (/${pathPrepared})` : message
          return reject(new ConjureError(message))
        }

        // see https://developer.github.com/v3/#pagination
        const pagination = {}
        if (res.headers.Link) {
          const expr = /^\s*<https:\/\/api\.github\.com\/([^>]+)>;\s+rel="([^"]+)"\s*$/
          for (i = 0; i < 20; i++) { // 20 just to be safe
            const match = expr.exec(res.headers.Link)

            if (!match) {
              break
            }

            /*
              This will throw if `body` is not an object
              If GitHub returns headers for `next` pagination, this will add `.next` to `.pagination` to `body`
              `.pagination` is not normally enumerable
             */
            pagination[ match[2] ] = match[1]
          }
        }
        Object.defineProperty(body, 'pagination', {
          value: pagination,
          enumerable: false,
          configurable: false
        })

        resolve(body)
      })
    })
  }
}

module.exports = API
