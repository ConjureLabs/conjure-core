const Repo = require('../');

module.exports = class GitHubRepo extends Repo {
  constructor(apiRecord) {
    super({
      id: apiRecord.id,
      fullName: apiRecord.full_name,
      name: apiRecord.name,
      org: apiRecord.full_name.substr(0, apiRecord.full_name.length - 1 - apiRecord.name.length),
      permissions: {
        admin: apiRecord.permissions && apiRecord.permissions.admin,
        push: apiRecord.permissions && apiRecord.permissions.push,
        pull: apiRecord.permissions && apiRecord.permissions.pull
      },
      private: apiRecord.private,
      url: apiRecord.html_url
    });

    this.service = 'GitHub';
  }
};
