'use strict';

const async = require('async');

const getExistingComment = Symbol('get existing GitHub issue comment');

class GitHubIssue {
  constructor(payload) {
    this.payload = payload;
  }

  upsertComment(body, callback) {
    this[getExistingComment]((err, comment) => {
      if (err) {
        return callback(err);
      }

      const GitHubIssueComment = require('./Comment');
      comment = comment || new GitHubIssueComment(this);

      comment.save(body, callback);
    });
  }

  deleteComment(callback) {
    this[getExistingComment]((err, comment) => {
      if (err) {
        return callback(err);
      }

      if (!comment) {
        return callback();
      }

      comment
        .set({
          is_active: false,
          updated: new Date()
        })
        .save(err => {
          callback(err);
        });
    });
  }

  [getExistingComment](callback) {
    const waterfall = [];

    waterfall.push(cb => {
      this.payload.getWatchedRepoRecord(cb);
    });

    waterfall.push((watchedRepo, cb) => {
      const DatabaseTable = require('../../../DatabaseTable');
      DatabaseTable.select('github_issue_comment', {
        watched_repo: watchedRepo.id,
        issue_id: this.payload.number,
        is_active: true
      }, (err, rows) => {
        if (err) {
          return cb(err);
        }

        return cb(null, rows[0]);
      });
    });

    async.waterfall(waterfall, (err, commentRecord) => {
      const DatabaseRow = require('../../../DatabaseRow');
      const GitHubIssueComment = require('./Comment');
      return callback(err, commentRecord instanceof DatabaseRow ? new GitHubIssueComment(this, commentRecord) : null);
    });
  }
}

module.exports = GitHubIssue;
