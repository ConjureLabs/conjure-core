const jwt = require('jsonwebtoken')
const { readFileSync } = require('fs')
const { resolve } = require('path')
const { ContentError, NotFoundError } = require('@conjurelabs/err')

const API = require('../')
const config = require('../../../../modules/config')

// reading sync once
const pem = readFileSync(resolve(__dirname, 'conjure-dev.pem')) // eslint no-sync: 0

// see https://developer.github.com/apps/building-github-apps/authentication-options-for-github-apps/#authenticating-as-an-installation
// see https://developer.github.com/v3/apps/installations/
// some requests need a 2-step process of auth, where auth tokens are valid for 10 min
// todo: cache generated tokens on redis or something, so beanstalk doesn't destroy limits
const pathsRequiringAppAuth = /^\/?installation/

// see https://developer.github.com/v3/apps/permissions/
class AppTokenAPI extends API {
  static async fromOrg(orgName) {
    const { DatabaseTable } = require('@conjurelabs/db')
    const installations = await DatabaseTable.select('githubAppInstallation', {
      username: orgName,
      inactive: false
    })
    if (!installations.length) {
      throw new NotFoundError(`GitHub app installation for org ${orgName} not found`)
    }
    const install = installations[0]
    return new AppTokenAPI(install.installationId)
  }

  constructor(installationId, forceTwoStep = false) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    // see https://developer.github.com/apps/building-github-apps/authentication-options-for-github-apps/#authenticating-as-a-github-app
    const token = jwt.sign({
      iat: nowSeconds,
      exp: nowSeconds + (10 * 60), // 10 minutes
      iss: config.services.github.app.id
    }, pem, {
      algorithm: 'RS256'
    })

    super({
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    this.installationId = installationId
    this.forceTwoStep = forceTwoStep
  }

  async request(opts) {
    if (this.forceTwoStep || pathsRequiringAppAuth.test(opts.path)) {
      return await this.handleTwoStepRequest(opts)
    }

    return super.request(opts)
  }

  async handleTwoStepRequest(opts) {
    if (!this.installationId) {
      throw new ContentError(`GitHub App API must be contructed with installation id, if making installation-specific requests (${opts.path})`)
    }

    const accessBoby = await super.request({
      path: `installations/${this.installationId}/access_tokens`,
      method: 'POST'
    })

    const UserAPI = require('../User')
    const api = new UserAPI(accessBoby.token)

    return api.request(opts)
  }
}

module.exports = AppTokenAPI
