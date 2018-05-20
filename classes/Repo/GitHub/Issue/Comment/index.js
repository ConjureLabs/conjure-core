const { NotFoundError, UnexpectedError } = require('@conjurelabs/err')
const AWS = require('aws-sdk')
const config = require('../../../../../modules/config')
const log = require('../../../../../modules/log')('github issue comment')

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

  async save(body) {
    const gitHubClient = await this.issue.payload.getGitHubClient()
    if (!gitHubClient) {
      throw new NotFoundError('No github account record found')
    }
    gitHubClient.forceTwoStep = true // these are integration endpoints

    if (this.commentRow && this.commentRow.isActive === true) {
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

    // see https://developer.github.com/v3/issues/comments/#create-a-comment
    const issueCommentResponse = await gitHubClient.request({
      path: `/repos/${orgName}/${repoName}/issues/${number}/comments`,
      method: 'POST',
      body: {
        // { "body": "Me too" }
        body: body
      }
    })

    // need to get watched repo record, so we can know its id (for next step)
    const watchedRepo = await this.issue.payload.getWatchedRepoRecord()

    // creating new comment record on our end
    const { DatabaseTable } = require('@conjurelabs/db')
    const commentRows = await DatabaseTable.insert('githubIssueComment', {
      watchedRepo: watchedRepo.id,
      issueId: number,
      commentId: issueCommentResponse.id,
      url: issueCommentResponse.html_url,
      isActive: true,
      s3Key: (await s3Data).Key,
      added: new Date()
    })
    this.commentRow = commentRows[0]

    return this.commentRow
  }

  async [updateComment](gitHubClient, body) {
    log.info('updating existing issue comment, on github')

    // making sure it's still active
    // this should not happen
    if (this.commentRow.isActive !== true) {
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
    
    // see https://developer.github.com/v3/issues/comments/#edit-a-comment
    await gitHubClient.request({
      path: `/repos/${orgName}/${repoName}/issues/comments/${this.commentRow.commentId}`,
      method: 'PATCH',
      body: {
        // { "body": "Me too" }
        body: body
      }
    })

    // tracking updated time on our record
    await this.commentRow
      .set({
        updated: new Date(),
        s3Key: (await s3Data).Key
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
        isActive: false,
        updated: new Date()
      })
      .save()

    // getting github client
    const gitHubClient = await this.issue.payload.getGitHubClient()
    if (!gitHubClient) {
      throw new NotFoundError('No github client found')
    }
    gitHubClient.forceTwoStep = true

    // now deleting the actual comment on github
    const {
      orgName,
      repoName,
      number
    } = this.issue.payload

    // see https://developer.github.com/v3/issues/comments/#delete-a-comment
    await gitHubClient.request({
      path: `/repos/${orgName}/${repoName}/issues/comments/${this.commentRow.commentId}`,
      method: 'DELETE'
    })

    // removing local attributes, since comment is gone
    this.commentRow = null

    return null
  }
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
