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
      request({
        url: `https://api.github.com/${path.replace(leadingSlash, '')}`,
        method,
        headers: this.headers,
        json: true,
        ...opts
      }, (err, res, body) => {
        if (err) {
          return reject(err)
        }

        if (res.statusCode !== 200) {
          /*
            e.g.
            { message: 'Not Found',
              documentation_url: 'https://developer.github.com/v3' }
           */
          return reject(new ConjureError(body.message || `Github returned code ${res.statusCode}`))
        }

        resolve(body)
      })
    })
  }
}

module.exports = API
