const async = require('async');
const appRoot = require('app-root-path');
const log = require(`${appRoot}/modules/log`)('github issue');

const getExistingComment = Symbol('get existing GitHub issue comment');

class GitHubIssue {
  constructor(payload) {
    this.payload = payload;
  }

  upsertComment(body, callback) {
    this[getExistingComment]((err, watchedRepo, existingComment) => {
      if (err) {
        return callback(err);
      }

      const GitHubIssueComment = require('./Comment');
      const comment = existingComment || new GitHubIssueComment(this);

      comment.save(body, err => {
        if (err) {
          if (!(existingComment && err && err.statusCode === 404)) {
            return callback(err);
          }

          log.info('github comment save returned 404');

          // comment was deleted, likely by user (but possibly a system hiccup?)
          // so, will just add a new one, so that the flow does not break down
  
          const series = [];

          // will also wipe record of old (broken) comment
          series.push(cb => {
            const DatabaseTable = require(`${appRot}/classes/DatabaseTable`);
            DatabaseTable.update('github_issue_comment', {
              is_active: false,
              updated: new Date()
            }, {
              watched_repo: watchedRepo.id,
              issue_id: this.payload.number,
              is_active: true
            }, err => {
              cb(err);
            });
          });

          series.push(cb => {
            const forcedNewComment = new GitHubIssueComment(this);
            forcedNewComment.save(body, err => {
              cb(err);
            });
          });

          async.series(series, err => {
            callback(err);
          });
          return;
        }

        callback();
      });
    });
  }

  deleteComment(callback) {
    this[getExistingComment]((err, watchedRepo, comment) => {
      if (err) {
        return callback(err);
      }

      if (!comment) {
        return callback();
      }

      comment.delete(callback);
    });
  }

  [getExistingComment](callback) {
    const waterfall = [];

    waterfall.push(cb => {
      this.payload.getWatchedRepoRecord(cb);
    });

    waterfall.push((watchedRepo, cb) => {
      const DatabaseTable = require(`${appRoot}/classes/DatabaseTable`);
      DatabaseTable.select('github_issue_comment', {
        watched_repo: watchedRepo.id,
        issue_id: this.payload.number,
        is_active: true
      }, (err, rows) => {
        if (err) {
          return cb(err);
        }

        return cb(null, watchedRepo, rows[0]);
      });
    });

    async.waterfall(waterfall, (err, watchedRepo, commentRecord) => {
      const DatabaseRow = require(`${appRoot}/classes/DatabaseRow`);
      const GitHubIssueComment = require('./Comment');
      return callback(err, watchedRepo, commentRecord instanceof DatabaseRow ? new GitHubIssueComment(this, commentRecord) : null);
    });
  }
}

module.exports = GitHubIssue;
