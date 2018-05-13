const jwt = require('jsonwebtoken')
const { readFileSync } = require('fs')
const { resolve } = require('path')

const API = require('../')
const config = require('../../../../modules/config')

// reading sync once
const pem = readFileSync(resolve(__dirname, 'conjure-dev.pem')) // eslint no-sync: 0

class AppTokenAPI extends API {
  constructor() {
    const nowSeconds = Math.floor(Date.now() / 1000)
    // see https://developer.github.com/apps/building-github-apps/authentication-options-for-github-apps/#authenticating-as-a-github-app
    const token = jwt.sign({
      iat: nowSeconds,
      exp: nowSeconds + (10 * 60), // 10 minutes
      iss: config.services.github.id
    }, pem, {
      algorithm: 'RS256'
    })

    super({
      headers: {
        Authorization: `bearer ${token}`
      }
    })
  }
}

module.exports = AppTokenAPI
