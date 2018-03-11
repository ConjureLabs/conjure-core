const { UnexpectedError } = require('@conjurelabs/err')

const TYPE_BRANCH = Symbol('is related to a branch')
const TYPE_COMMIT = Symbol('is related to a commit')
const TYPE_PULL_REQUEST = Symbol('is related to a pull request')
const TYPE_UNKNOWN = Symbol('is of unknown type')

const ACTION_ADDED = Symbol('addition')
const ACTION_CLOSED = Symbol('close')
const ACTION_DELETED = Symbol('deletion')
const ACTION_MERGED = Symbol('merge')
const ACTION_OPENED = Symbol('open')
const ACTION_REOPENED = Symbol('re-open')
const ACTION_RESTORED = Symbol('resotration')
const ACTION_UNKOWN = Symbol('uknown action')
const ACTION_UPDATED = Symbol('update')

const cached = Symbol('cached data')

class WebhookPayload {
  constructor(payload) {
    this.payload = payload
    this[cached] = {}

    // uncomment for debug
    // console.log(this.payload)
  }

  static get types() {
    return {
      branch: TYPE_BRANCH,
      commit: TYPE_COMMIT,
      pullRequest: TYPE_PULL_REQUEST,
      uknown: TYPE_UNKNOWN
    }
  }

  static get actions() {
    return {
      added: ACTION_ADDED,
      closed: ACTION_CLOSED,
      deleted: ACTION_DELETED,
      merged: ACTION_MERGED,
      opened: ACTION_OPENED,
      reopened: ACTION_REOPENED,
      restored: ACTION_RESTORED,
      uknown: ACTION_UNKOWN,
      updated: ACTION_UPDATED
    }
  }

  get type() {
    const { payload } = this

    if (payload.pull_request) {
      return TYPE_PULL_REQUEST
    }

    if (Array.isArray(payload.commits)) {
      if (isAllZeros(payload.after) || isAllZeros(payload.before)) {
        return TYPE_BRANCH
      }

      return TYPE_COMMIT
    }

    return TYPE_UNKNOWN
  }

  get action() {
    const { payload } = this
    const type = this.type

    switch (type) {
      case TYPE_BRANCH:
        if (isAllZeros(payload.after)) {
          return ACTION_CLOSED
        } else if (isAllZeros(payload.before)) {
          return ACTION_RESTORED
        }
        return ACTION_UNKOWN

      case TYPE_COMMIT:
        return ACTION_ADDED

      case TYPE_PULL_REQUEST:
        switch (payload.action) {
          case 'closed':
            if (typeof payload.pull_request.merged_at === 'string') {
              return ACTION_MERGED
            }
            return ACTION_CLOSED

          case 'opened':
            return ACTION_OPENED

          case 'reopened':
            return ACTION_REOPENED

          case 'synchronize':
            return ACTION_UPDATED

          default:
            return ACTION_UNKOWN
        }

      default:
        return ACTION_UNKOWN
    }
  }

  get branch() {
    const { payload } = this
    const type = this.type

    switch(type) {
      case TYPE_PULL_REQUEST:
        return payload.pull_request.head.ref

      default:
        return payload.ref
    }
  }

  get sha() {
    const { payload } = this
    const type = this.type

    switch(type) {
      case TYPE_PULL_REQUEST:
        return payload.pull_request.head.sha

      default:
        return payload.head_commit ? payload.head_commit.id : null
    }
  }

  get prevSha() {
    const { payload } = this

    return payload.before
  }

  /*
    gets the github account record for the given payload
    this may be the author that triggered the webhook payload,
    or may be another user on the repo (if the author is not on Conjure)
   */
  async getGitHubAccount() {
    if (this[cached].gitHubAccount) {
      return this[cached].gitHubAccount
    }

    let githubAccountRows

    const gitHubId = this.payload.sender.id

    const DatabaseTable = require('@conjurelabs/db/table')
    // attempting to pull conjure account record for the payload author
    githubAccountRows = await DatabaseTable.select('account_github', {
      github_id: gitHubId
    })

    // assuming paylaod author has RW access (since triggered a PR)

    // if we have an associated record for the payload author...
    if (Array.isArray(githubAccountRows) && githubAccountRows.length) {
      this[cached].gitHubAccount = githubAccountRows[0]

      // callback handler should deal with undefined row
      return githubAccountRows[0]
    }

    // no associated record to payload author - will try to look up a different user in our system
    const accountRepoRows = await DatabaseTable.select('account_repo', {
      service: 'github',
      service_repo_id: this.repoId,
      access_rights: 'rw'
    })

    // prune out a possible row for the previously queried github id
    if (Array.isArray(accountRepoRows) && accountRepoRows.length && accountRepoRows[0].account === gitHubId) {
      accountRepoRows.shift()
    }

    // if nothing, callback with nothing
    if (!Array.isArray(accountRepoRows) || !accountRepoRows.length) {
      return null
    }

    // have another record - pulling github account record
    githubAccountRows = await DatabaseTable.select('account_github', {
      account: accountRepoRows[0].account
    })

    // this should not happen
    if (!Array.isArray(githubAccountRows) || !githubAccountRows.length) {
      return null
    }

    this[cached].gitHubAccount = githubAccountRows[0]

    // callback handler should deal with undefined row
    return githubAccountRows[0]
  }

  // will likely fail if not a pull request payload
  get number() {
    return this.payload.number
  }

  // will likely fail if not a pull request payload
  get branchRef() {
    return this.payload.pull_request.head.ref
  }

  // returns github repo id
  get repoId() {
    return this.payload.repository.id
  }

  get repoName() {
    return this.payload.repository.name
  }

  get orgName() {
    const fullName = this.payload.repository.full_name
    return fullName.substr(0, (fullName.length - this.repoName.length - 1))
  }

  // finds the watched repo record
  async getWatchedRepoRecord() {
    if (this[cached].watchedRepo) {
      return this[cached].watchedRepo
    }

    const DatabaseTable = require('@conjurelabs/db/table')
    const rows = await DatabaseTable.select('watched_repo', {
      service_repo_id: this.repoId
    })

    if (!rows.length) {
      // todo: this may be legit if a PR is changed post-enabling conjure - maybe just log a warning?
      throw new UnexpectedError('this repo is not being watched by Conjure')
    }

    this[cached].watchedRepo = rows[0]
    return rows[0]
  }
}

const exprAllZeros = /0/g
function isAllZeros(str) {
  if (
    str &&
    typeof str === 'string' &&
    str.includes('0') &&
    str.replace(exprAllZeros, '').length === 0
  ) {
    return true
  }

  return false
}

module.exports = WebhookPayload
