'use strict';

const Repo = require('../');

module.exports = class GitHubRepo extends Repo {
  constructor(apiRecord) {
    super({
      id: apiRecord.id,
      fullName: apiRecord.full_name,
      name: apiRecord.name,
      private: apiRecord.private,
      url: apiRecord.html_url
    });

    this.service = 'GitHub';
  }
};
