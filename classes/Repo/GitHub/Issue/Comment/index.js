'use strict';

const getGitHubClient = Symbol('get GitHub api client instance');
const createComment = Symbol('create new comment');
const updateComment = Symbol('update existing comment');

class GitHubIssueComment {
  constructor(issueInstance, commentRow) {
    this.issue = issueInstance;
    this.commentRow = commentRow;
    this.commentId = commentRow !== undefined ? commentRow.issue_id : null;
  }

  [getGitHubClient](callback) {
    this.payload.getGitHubAccount((err, gitHubAccount) => {
      if (err) {
        return callback(err);
      }

      if (!gitHubAccount) {
        return callback(new Error('No github account record found'));
      }

      const github = require('octonode');
      const gitHubClient = github.client(gitHubAccount.access_token);

      callback(null, getGitHubClient);
    });
  }

  save(body, callback) {
    this[getGitHubClient]((err, gitHubClient) => {
      if (err) {
        return callback(err);
      }

      if (this.commentId) {
        return this[updateComment](gitHubClient, body, callback);
      }

      this[createComment](gitHubClient, body, callback);
    });
  }

  [createComment](gitHubClient, body, callback) => {
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
        }, (err, _, body) => {
          cb(err, body);
        });
    });

    // need to get watched repo record, so we can know its id (for next step)
    waterfall.push((commentCreationBody, cb) => {
      this.issue.payload.watchedRepoRecord((err, watchedRepo) => {
        cb(err, commentCreationBody, watchedRepo);
      });
    });

    // creating new comment record on our end
    waterfall.push((commentCreationBody, watchedRepo, cb) => {
      const DatabaseTable = require('../../../../DatabaseTable');
      DatabaseTable.insert('github_issue_comment', {
        watched_repo: watchedRepo.id,
        issue_id: this.issue.payload.number,
        url: commentCreationBody.html_url,
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
      this.commentId = issueCommentRow.id;
      cb(null, issueCommentRow);
    });

    async.series(series, callback); // returns issue comment row
  }

  [updateComment](gitHubClient, body, callback) => {
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
        .updateComment(this.commentId, {
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
      cb(err, this.commentRow); // returns updated comment row
    });
  }

  delete(callback) {
    if (!this.commentId) {
      return callback(new Error('Can not delete a comment without referencing existing row'));
    }
  }
}

module.exports = GitHubIssueComment;
