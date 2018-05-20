const { UnexpectedError, NotFoundError } = require('@conjurelabs/err')

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
    this[cached] = {
      gitHubAccount: null,
      gitHubClient: null
    }

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

  get title() {
    const { payload } = this
    const type = this.type

    switch (type) {
      case TYPE_PULL_REQUEST:
        return payload.pull_request.title

      default:
        return this.sha
    }
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

    const { DatabaseTable } = require('@conjurelabs/db')

    // pulling repo records first
    const accountRepoRows = await DatabaseTable.select('accountRepo', {
      service: 'github',
      serviceRepoId: this.repoId,
      accessRights: 'rw' // need rw to write comment
    })

    // if nothing, callback with nothing
    if (!Array.isArray(accountRepoRows) || !accountRepoRows.length) {
      return null
    }

    // checking rate limit, in order to verify token still is valid
    for (const accountRepo of accountRepoRows) {
      let currentGitHubAccount

      try {
        const gitHubAccountRows = await DatabaseTable.select('accountGithub', {
          account: accountRepo.account,
          accessTokenAssumedValid: true
        })
        if (!gitHubAccountRows.length) {
          // should not happen
          continue
        }
        currentGitHubAccount = gitHubAccountRows[0]

        const UserAPI = require('../../../../GitHub/API/User')
        const api = new UserAPI(currentGitHubAccount.accessToken)
        // limit api will throw if token if invalid
        // and limit api does count against usage
        // using this, as a hack, to test if token is valid
        await api.request({
          path: '/rate_limit'
        })

        this[cached].gitHubAccount = currentGitHubAccount
        break
      } catch(err) {
        if (currentGitHubAccount) {
          currentGitHubAccount
            .set({
              accessTokenAssumedValid: false
            })
            .save()
        }
      }
    }

    return this[cached].gitHubAccount
  }

  async getGitHubClient() {
    if (this[cached].gitHubClient) {
      return this[cached].gitHubClient
    }

    const AppAPI = require('../../../../GitHub/API/App')
    this[cached].githubClient = await AppAPI.fromOrg(this.orgName)
    return this[cached].githubClient
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

    const { DatabaseTable } = require('@conjurelabs/db')
    const rows = await DatabaseTable.select('watchedRepo', {
      serviceRepoId: this.repoId
    })

    if (!rows.length) {
      // todo: this may be legit if a PR is changed post-enabling conjure - maybe just log a warning?
      throw new UnexpectedError('this repo is not being watched by Conjure')
    }

    this[cached].watchedRepo = rows[0]
    return rows[0]
  }

  // gets app installation record (for github app)
  async getGitHubInstallationRecord() {
    const orgName = this.orgName
    const { DatabaseTable } = require('@conjurelabs/db')
    const rows = await DatabaseTable.select('githubAppInstallation', {
      username: orgName
    })
    if (rows.length === 0) {
      throw new NotFoundError('Not GitHub App installation record found for payload')
    }
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
