const log = require('../../../../modules/log')('github issue')

const getExistingComment = Symbol('get existing GitHub issue comment')

class GitHubIssue {
  constructor(payload) {
    this.payload = payload
  }

  async upsertComment(body) {
    const {
      watchedRepo,
      existingComment
    } = await this[getExistingComment]()
    
    const GitHubIssueComment = require('./Comment')
    const comment = existingComment || new GitHubIssueComment(this)

    try {
      await comment.save(body)
    } catch(saveErr) {
      if (!(existingComment && saveErr.statusCode === 404)) {
        throw saveErr
      }

      log.info('github comment save returned 404')

      // comment was deleted, likely by user (but possibly a system hiccup?)
      // so, will just add a new one, so that the flow does not break down
      
      const DatabaseTable = require('@conjurelabs/db/table')
      await DatabaseTable.update('github_issue_comment', {
        is_active: false,
        updated: new Date()
      }, {
        watched_repo: watchedRepo.id,
        issue_id: this.payload.number,
        is_active: true
      })

      const forcedNewComment = new GitHubIssueComment(this)
      await forcedNewComment.save(body)
    }
  }

  async deleteComment() {
    const {
      existingComment
    } = await this[getExistingComment]()

    if (existingComment) {
      await existingComment.delete()
    }
  }

  async [getExistingComment]() {
    const watchedRepo = await this.payload.getWatchedRepoRecord()
    const DatabaseTable = require('@conjurelabs/db/table')
    const rows = await DatabaseTable.select('github_issue_comment', {
      watched_repo: watchedRepo.id,
      issue_id: this.payload.number,
      is_active: true
    })
    const commentRecord = rows[0]
    const DatabaseRow = require('@conjurelabs/db/row')
    const GitHubIssueComment = require('./Comment/')

    return {
      watchedRepo,
      existingComment: commentRecord instanceof DatabaseRow ? new GitHubIssueComment(this, commentRecord) : null
    }
  }
}

module.exports = GitHubIssue
