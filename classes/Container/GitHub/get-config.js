const { ContentError, NotFoundError } = require('@conjurelabs/err')
const AppAPI = require('../../GitHub/API/App')

module.exports = function getConfig() {
  return new Promise(async (resolve, reject) => {
    const { repoName, orgName, branch } = this.payload
    const api = await AppAPI.fromOrg(orgName)
    api.forceTwoStep = true

    // see https://developer.github.com/v3/repos/contents/
    let result

    try {
      result = await api.request({
        path: `/repos/${orgName}/${repoName}/contents/.conjure/config.yml`,
        qs: {
          ref: branch
        }
      })
    } catch(err) {
      if (err.message === 'Not Found') {
        return reject(new ContentError('No Conjure YML config present in repo'))
      }
      return reject(err)
    }

    if (!result || result.type !== 'file' || typeof result.content !== 'string') {
      return reject(new ContentError('No Conjure YML config present in repo'))
    }

    const yml = new Buffer(result.content, 'base64')
    const Config = require('conjure-core/classes/Repo/Config')
    const ymlContent = new Config(yml)

    if (ymlContent.valid === false) {
      return reject(new ContentError('Invalid Conjure YML config'))
    }

    resolve(ymlContent)
  })
}
