'use strict';

const log = require('modules/log')('container create');

// todo: set up a module that handles cases like this
const asyncBreak = {};

let workerPort = parseInt(process.env.PORT, 10);
const bashNoOp = ':';

function containerCreate(callback) {
  log.info('starting create');

  const {
    branch,
    orgName,
    repoName
  } = this.payload;

  const uid = require('uid');

  const containerUid = uid(24);
  const waterfall = [];

  // get watched repo record
  waterfall.push(cb => {
    this.payload.watchedRepoRecord(cb);
  });

  // make sure the repo/branch is not already spun up
  waterfall.push((watchedRepo, cb) => {
    const DatabaseTable = require('classes/DatabaseTable');
    // todo: detect correct server host, but on develop / test keep localhost
    DatabaseTable.select('container_proxies', {
      repo: watchedRepo.id,
      branch: branch
    }, (err, records) => {
      if (err) {
        return cb(err);
      }

      if (records.length) {
        return cb(asyncBreak);
      }

      cb(null, watchedRepo);
    });
  });

  // get github client
  waterfall.push((watchedRepo, cb) => {
    // todo: store github repo key on repo level, since 'sender' may differ
    this.payload.getGitHubAccount((err, gitHubAccount) => {
      if (err) {
        return cb(err);
      }

      if (!gitHubAccount) {
        return cb(new Error('No github account record found'));
      }

      const github = require('octonode');
      const gitHubClient = github.client(gitHubAccount.access_token);

      cb(null, watchedRepo, gitHubClient, gitHubAccount.access_token);
    });
  });

  // get yml config
  waterfall.push((watchedRepo, gitHubClient, gitHubToken, cb) => {
    gitHubClient
      .repo(`${orgName}/${repoName}`)
      .contents('voyant.yml', branch, (err, file) => {
        // todo: handle errors, send a message to client/github
        if (
          (err && err.message === 'Not Found') ||
          (!file || file.type !== 'file' || typeof file.content !== 'string')
        ) {
          return cb(new Error('No Voyant YML config present in repo'));
        }

        if (err) {
          return cb(err);
        }

        const yml = new Buffer(file.content, 'base64');
        const Config = require('classes/Repo/Config');
        const repoConfig = new Config(yml);

        // todo: handle invalid yml errors better, send message to client/github
        if (repoConfig.valid === false) {
          return cb(new Error('Invalid Voyant YML config'));
        }

        cb(null, watchedRepo, repoConfig, gitHubClient, gitHubToken);
      });
  });

  // create container
  waterfall.push((watchedRepo, repoConfig, gitHubClient, gitHubToken, cb) => {
    const exec = require('modules/childProcess/exec');

    // todo: handle non-github repos
    
    let preSetupSteps = '';

    if (repoConfig.machine.pre.length) {
      preSetupSteps = repoConfig.machine.pre
        .map(command => {
          return `RUN ${command}`;
        })
        .join('\n');
      preSetupSteps = new Buffer(preSetupSteps).toString('base64');
    }

    const command = `bash ./build.sh "https://${gitHubToken}:x-oauth-basic@github.com/${orgName}/${repoName}.git" "${branch}" "${containerUid}" "${preSetupSteps}" "${repoConfig.machine.setup || bashNoOp}"`;
    exec(command, {
      cwd: process.env.VOYANT_WORKER_DIR
    }, err => {
      cb(err, watchedRepo, repoConfig, gitHubClient);
    });
  });

  // run container
  waterfall.push((watchedRepo, repoConfig, gitHubClient, cb) => {
    if (repoConfig.machine.start === null) {
      return cb(new Error('No container start command defined or known'));
    }

    const exec = require('modules/childProcess/exec');

    // may need to keep trying, if docker ports are already in use
    function attemptDockerRun() {
      const hostPort = ++workerPort;

      const extraEnvKeys = Object.keys(repoConfig.machine.environment);
      const extraEnvVars = !extraEnvKeys.length ? '' : extraEnvKeys
        .map(key => {
          return ` -e ${key}="${repoConfig.machine.environment[key]}"`;
        })
        .join('');

      const command = `docker run --cidfile /tmp/${containerUid}.cid -i -t -d -p ${hostPort}:${repoConfig.machine.port}${extraEnvVars} "${containerUid}" ${repoConfig.machine.start}`;
      exec(command, {
        cwd: process.env.VOYANT_WORKER_DIR
      }, (runErr, stdout) => {
        if (runErr) {
          exec(`rm /tmp/${containerUid}.cid`, {}, rmCidErr => {
            if (rmCidErr) {
              log.error(rmCidErr);
            }

            if (runErr.message && runErr.message.includes('port is already allocated')) {
              log.info('port is already allocated - attempting again');
              return attemptDockerRun();
            }

            cb(runErr);
          });
          return;
        }

        cb(null, watchedRepo, gitHubClient, hostPort, stdout);
      });
    }
    attemptDockerRun();
  });

  // save reference for container
  waterfall.push((watchedRepo, gitHubClient, hostPort, containerId, cb) => {
    const DatabaseTable = require('classes/DatabaseTable');
    // todo: detect correct server host, but on develop / test keep localhost
    DatabaseTable.insert('container_proxies', {
      repo: watchedRepo.id,
      branch: branch,
      host: 'localhost',
      port: hostPort,
      container_id: containerId,
      url_uid: containerUid,
      added: new Date()
    }, err => {
      cb(err, hostPort, gitHubClient);
    });
  });

  waterfall.push((hostPort, gitHubClient, cb) => {
    const config = require('modules/config');
    const {
      protocol,
      domain
    } = config.app;

    // todo: not use user's account to post comment (may not be possible, unless can get integration access from github)
    gitHubClient
      .issue(`${orgName}/${repoName}`, this.payload.number)
      .createComment({
        body: `${protocol}://${domain}:${hostPort}`
      }, err => {
        cb(err);
      });
  });

  const async = require('async');
  async.waterfall(waterfall, err => {
    if (err === asyncBreak) {
      return callback();
    }

    callback(err);
  });
}

module.exports = containerCreate;
