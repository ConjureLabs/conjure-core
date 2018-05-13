const API = require('../')

class UserTokenAPI extends API {
  constructor(token) {
    super({
      headers: {
        Authorization: `token ${token}`
      }
    })
  }
}

module.exports = UserTokenAPI
