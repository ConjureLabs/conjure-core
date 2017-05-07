'use strict';

const Container = require('../');
const log = require('../../../modules/log')('github container');

const parentCreate = require('../create');
const parentDestroy = require('../destroy');

class GitHubContainer extends Container {
  // saving github comment, when creating a new container
  create(callback) {
    parentCreate(err => {
      if (err) {
        return callback(err);
      }

      const Issue = require('../../Repo/GitHub/Issue');
      const issue = new Issue(this.payload);

      const config = require('../../modules/config');
      const {
        protocol,
        domain
      } = config.app;
      const { branch } = this.payload;

      issue.upsertComment([
        '<kbd>⎔</kbd>',
        '',
        `:octocat: [You can view this branch at ${protocol}://${domain}:${hostPort}](${protocol}://${domain}:${hostPort})`,
        '',
        '---',
        '',
        `- This message was create via [⎔ Conjure.sh](${protocol}://${domain})`
      ].join('\n'), err => {
        callback(err);
      });
    });
  }

  destroy(callback) {
    parentDestroy(err => {
      if (err) {
        return callback(err);
      }

      const Issue = require('../../Repo/GitHub/Issue');
      const issue = new Issue(this.payload);

      issue.deleteComment(err => {
        if (err) {
          log.error(err);
          return;
        }

        callback();
      });
    });
  }
}

module.exports = Container;
