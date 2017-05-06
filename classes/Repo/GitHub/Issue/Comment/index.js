'use strict';

const getGitHubClient = Symbol('get GitHub api client instance');

class GitHubIssueComment {
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
}

module.exports = GitHubIssueComment;
