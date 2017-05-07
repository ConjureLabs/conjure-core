'use strict';

const Container = require('../');
const log = require('../../../modules/log')('github container');
const async = require('async');
const config = require('../../../modules/config');

const {
  protocol,
  domain
} = config.app;

const gitHubCommentSignature = [
  '',
  '---',
  '',
  `__This message was generated via [<kbd>⎔ Conjure.sh</kbd>](${protocol}://${domain})__`
];

class GitHubContainer extends Container {
  // saving github comment, when creating a new container
  create(callback) {
    const waterfall = [];

    const Issue = require('../../Repo/GitHub/Issue');
    const issue = new Issue(this.payload);

    // commenting on issue thread to notify that an instance is spinning up
    waterfall.push(cb => {
      issue.upsertComment([
        `:hourglass_flowing_sand: [Conjure.sh](${protocol}://${domain}) is spinning up this branch`,
      ].concat(gitHubCommentSignature).join('\n'), err => {
        cb(err);
      });
    });

    // create vm
    waterfall.push(cb => {
      super.create((err, hostPort) => {
        cb(err, hostPort);
      });
    });

    waterfall.push((hostPort, cb) => {
      issue.upsertComment([
        `:octocat: [You can view this branch at ${protocol}://${domain}:${hostPort}](${protocol}://${domain}:${hostPort})`,
      ].concat(gitHubCommentSignature).join('\n'), err => {
        cb(err);
      });
    });

    async.waterfall(waterfall, callback);
  }

  destroy(callback) {
    super.destroy(err => {
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

module.exports = GitHubContainer;
