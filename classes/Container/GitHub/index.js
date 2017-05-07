'use strict';

const Container = require('../');

class GitHubContainer extends Container {
  // saving github comment, when creating a new container
  create(callback) {
    super.create(err => {
      if (err) {
        return callback(err);
      }

      const Issue = require('../../Repo/GitHub/Issue');

      const config = require('../../modules/config');
      const {
        protocol,
        domain
      } = config.app;
      const { branch } = this.payload;

      Issue.upsertComment([
        '<kbd>⎔</kbd>',
        '',
        `:octocat: [You can view this branch at ${protocol}://${domain}:${hostPort}](${protocol}://${domain}:${hostPort})`
        '',
        '---',
        '',
        `- This message was create via [Conjure.sh](${protocol}://${domain})`
      ].join('\n'), err => {
        callback(err);
      });
    });
  }
}

module.exports = Container;
