const Container = require('../')
const IssueComment = require('../../GitHub/IssueComment')

const config = require('../../../modules/config')

const webUrl = config.app.web.url

class GitHubContainer extends Container {
  // saving github comment, when creating a new container
  async create() {
    const issueComment = new IssueComment(this.payload)
    // commenting on issue thread to notify that an instance is spinning up
    await issueComment.upsert(`:hourglass_flowing_sand: [Conjure](${webUrl}) is spinning up this branch`)

    // create vm
    const containerUid = await super.create()
    const containerUrl = `${config.app.web.protocol}://${containerUid}.view.${config.app.web.host}`
    await issueComment.upsert(`:octocat: [You can view this branch on Conjure](${containerUrl})`)
  }

  async stop() {
    await super.stop()

    const issueComment = new IssueComment(this.payload)
    const containerRequestUrl = `${config.app.web.url}/start/${orgName}/${repoName}/${number}`
    await issueComment.upsert(`:ghost: [You can spin up this branch on Conjure](${containerRequestUrl})`)
  }

  async prune() {
    const issueComment = new IssueComment(this.payload)
    await issueComment.delete()

    await super.prune()
  }
}

GitHubContainer.prototype.getConfig = require('./get-config')
GitHubContainer.prototype.dockerBuild = require('./docker-build')

module.exports = GitHubContainer
