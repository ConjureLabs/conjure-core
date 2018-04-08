const { NotFoundError, UnexpectedError } = require('@conjurelabs/err')
const AWS = require('aws-sdk')
const config = require('../../../../../modules/config')
const log = require('../../../../../modules/log')('github issue comment')

const getGitHubClient = Symbol('get GitHub api client instance')
const createComment = Symbol('create new comment')
const updateComment = Symbol('update existing comment')

AWS.config.update({
  accessKeyId: config.aws.accessKey,
  secretAccessKey: config.aws.secretKey,
  region: config.aws.default.region
})

class GitHubIssueComment {
  constructor(issueInstance, commentRow) {
    this.issue = issueInstance
    this.commentRow = commentRow
  }

  async [getGitHubClient]() {
    const gitHubAccount = await this.issue.payload.getGitHubAccount()
    if (!gitHubAccount) {
      throw new NotFoundError('No github account record found')
    }

    const github = require('octonode')
    const gitHubClient = github.client(gitHubAccount.access_token)

    return gitHubClient
  }

  async save(body) {
    const gitHubClient = await this[getGitHubClient]()

    if (this.commentRow && this.commentRow.is_active === true) {
      return await this[updateComment](gitHubClient, body)
    }

    return await this[createComment](gitHubClient, body)
  }

  async [createComment](gitHubClient, body) {
    log.info('creating new issue comment, on github')

    const { payload } = this.issue

    const {
      orgName,
      repoName,
      number
    } = payload

    // saving payload to s3, for later access
    const s3Data = uploadToS3(payload)

    // actual comment creation
    const issueCommentResponse = await createGitHubIssueComment(gitHubClient, orgName, repoName, number, body)

    // need to get watched repo record, so we can know its id (for next step)
    const watchedRepo = await this.issue.payload.getWatchedRepoRecord()

    // creating new comment record on our end
    const { DatabaseTable } = require('@conjurelabs/db')
    const commentRows = await DatabaseTable.insert('github_issue_comment', {
      watched_repo: watchedRepo.id,
      issue_id: number,
      comment_id: issueCommentResponse.id,
      url: issueCommentResponse.html_url,
      is_active: true,
      s3_key: (await s3Data).Key,
      added: new Date()
    })
    this.commentRow = commentRows[0]

    return this.commentRow
  }

  async [updateComment](gitHubClient, body) {
    log.info('updating existing issue comment, on github')

    // making sure it's still active
    // this should not happen
    if (this.commentRow.is_active !== true) {
      throw new UnexpectedError('Can not update comment that is not longer active')
    }

    const { payload } = this.issue

    const {
      orgName,
      repoName,
      number
    } = payload

    // saving payload to s3, for later access
    const s3Data = uploadToS3(payload)

    // updating github comment
    await updateGitHubIssueComment(gitHubClient, orgName, repoName, number, this.commentRow.comment_id, body)

    // tracking updated time on our record
    await this.commentRow
      .set({
        updated: new Date(),
        s3_key: (await s3Data).Key
      })
      .save()

    return this.commentRow
  }

  async delete() {
    if (!this.commentRow) {
      throw new UnexpectedError('Can not delete a comment without referencing existing row')
    }

    log.info('deleting existing issue comment, on github')

    // first deleting our own record of the comment
    await this.commentRow
      .set({
        is_active: false,
        updated: new Date()
      })
      .save()

    // getting github client
    const gitHubClient = await this[getGitHubClient]()

    // now deleting the actual comment on github
    const {
      orgName,
      repoName,
      number
    } = this.issue.payload

    await deleteGitHubIssueComment(gitHubClient, orgName, repoName, number, this.commentRow.comment_id)

    // removing local attributes, since comment is gone
    this.commentRow = null

    return null
  }
}

function createGitHubIssueComment(gitHubClient, orgName, repoName, issueNumber, body) {
  return new Promise((resolve, reject) => {
    // will need integration access from github, in order to post as ourselves, not the user
    gitHubClient
      .issue(`${orgName}/${repoName}`, issueNumber)
      .createComment({
        body
      }, (err, response) => {
        if (err) {
          return reject(err)
        }

        resolve(response)
      })
  })
}

function updateGitHubIssueComment(gitHubClient, orgName, repoName, issueNumber, commentId, body) {
  return new Promise((resolve, reject) => {
    // will need integration access from github, in order to post as ourselves, not the user
    gitHubClient
      .issue(`${orgName}/${repoName}`, issueNumber)
      .updateComment(commentId, {
        body
      }, (err, response) => {
        if (err) {
          return reject(err)
        }

        resolve(response)
      })
  })
}

function deleteGitHubIssueComment(gitHubClient, orgName, repoName, issueNumber, commentId) {
  return new Promise((resolve, reject) => {
    // will need integration access from github, in order to post as ourselves, not the user
    gitHubClient
      .issue(`${orgName}/${repoName}`, issueNumber)
      .deleteComment(commentId, (err, response) => {
        if (err) {
          return reject(err)
        }

        resolve(response)
      })
  })
}

function uploadToS3(payload) {
  return new Promise((resolve, reject) => {
    const { orgName, repoName, branch, sha } = payload

    const s3 = new AWS.S3({
      params: {
        Bucket: config.aws.s3.buckets.gitHubPayloads
      }
    })

    s3.upload({
      Key: `${orgName}/${repoName}/${branch}/${sha}.json`,
      Body: JSON.stringify(payload),
      // https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl
      ACL: 'bucket-owner-full-control'
    }, (err, data) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

module.exports = GitHubIssueComment
