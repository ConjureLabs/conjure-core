'use strict';

const async = require('async');
const log = require('../../../../../modules/log')('github issue comment');

const getGitHubClient = Symbol('get GitHub api client instance');
const createComment = Symbol('create new comment');
const updateComment = Symbol('update existing comment');

class GitHubIssueComment {
  constructor(issueInstance, commentRow) {
    this.issue = issueInstance;
    this.commentRow = commentRow;
  }

  [getGitHubClient](callback) {
    this.issue.payload.getGitHubAccount((err, gitHubAccount) => {
      if (err) {
        return callback(err);
      }

      if (!gitHubAccount) {
        return callback(new Error('No github account record found'));
      }

      const github = require('octonode');
      const gitHubClient = github.client(gitHubAccount.access_token);

      callback(null, gitHubClient);
    });
  }

  save(body, callback) {
    this[getGitHubClient]((err, gitHubClient) => {
      if (err) {
        return callback(err);
      }

      if (this.commentRow) {
        return this[updateComment](gitHubClient, body, callback);
      }

      this[createComment](gitHubClient, body, callback);
    });
  }

  [createComment](gitHubClient, body, callback) {
    log.info('creating new issue comment, on github');

    const waterfall = [];

    // actual comment creation
    waterfall.push(cb => {
      const {
        orgName,
        repoName,
        number
      } = this.issue.payload;

      // todo: not use user's account to post comment (may not be possible, unless can get integration access from github)
      gitHubClient
        .issue(`${orgName}/${repoName}`, number)
        .createComment({
          body: body
        }, (err, response) => {
          cb(err, response);
        });
    });

    // need to get watched repo record, so we can know its id (for next step)
    waterfall.push((commentCreationBody, cb) => {
      this.issue.payload.getWatchedRepoRecord((err, watchedRepo) => {
        cb(err, commentCreationBody, watchedRepo);
      });
    });

    // creating new comment record on our end
    waterfall.push((commentCreationBody, watchedRepo, cb) => {
      const DatabaseTable = require('../../../../DatabaseTable');
      DatabaseTable.insert('github_issue_comment', {
        watched_repo: watchedRepo.id,
        issue_id: this.issue.payload.number,
        comment_id: commentCreationBody.id,
        url: commentCreationBody.html_url,
        is_active: true,
        added: new Date()
      }, (err, rows) => {
        if (err) {
          return cb(err);
        }

        cb(null, rows[0]);
      });
    });

    // updating self with new comment record details
    waterfall.push((issueCommentRow, cb) => {
      this.commentRow = issueCommentRow;
      cb(null, issueCommentRow);
    });

    async.waterfall(waterfall, callback); // returns issue comment row
  }

  [updateComment](gitHubClient, body, callback) {
    log.info('updating existing issue comment, on github');

    const waterfall = [];

    // updating github comment
    waterfall.push(cb => {
      const {
        orgName,
        repoName,
        number
      } = this.issue.payload;

      // todo: not use user's account to post comment (may not be possible, unless can get integration access from github)
      gitHubClient
        .issue(`${orgName}/${repoName}`, number)
        .updateComment(this.commentRow.id, {
          body: body
        }, err => {
          cb(err);
        });
    });

    // tracking updated time on our record
    waterfall.push(cb => {
      this.commentRow.updated = new Date();
      this.commentRow.save(err => {
        cb(err);
      });
    });

    async.waterfall(waterfall, err => {
      callback(err, this.commentRow); // returns updated comment row
    });
  }

  delete(callback) {
    if (!this.commentRow) {
      return callback(new Error('Can not delete a comment without referencing existing row'));
    }

    log.info('deleting existing issue comment, on github');

    const waterfall = [];
    const commentId = this.commentRow.comment_id;

    // first deleting our own record of the comment
    waterfall.push(cb => {
      this.commentRow
        .update({
          is_active: false,
          updated: new Date()
        })
        .save(err => {
          cb(err);
        });
    });

    // getting github client
    waterfall.push(cb => {
      this[getGitHubClient](cb);
    });

    // now deleting the actual comment on github
    waterfall.push((gitHubClient, cb) => {
      const {
        orgName,
        repoName,
        number
      } = this.issue.payload;

      // todo: not use user's account to post comment (may not be possible, unless can get integration access from github)
      gitHubClient
        .issue(`${orgName}/${repoName}`, number)
        .deleteComment(commentId, err => {
          cb(err);
        });
    });

    // removing local attributes, since comment is gone
    waterfall.push(cb => {
      this.commentRow = null;
      return cb();
    });

    async.waterfall(waterfall, err => {
      callback(err); // returning nothing
    });
  }
}

module.exports = GitHubIssueComment;
