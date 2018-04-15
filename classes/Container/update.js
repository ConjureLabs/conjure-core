const log = require('../../modules/log')('container update')
const { UnexpectedError } = require('@conjurelabs/err')

async function containerUpdate() {
  log.info('starting update')

  const { branch } = this.payload

  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  let containerRecord = await this.getActiveRecord()
  let oldRecord

  const { DatabaseTable } = require('@conjurelabs/db')

  if (containerRecord) {
    oldRecord = containerRecord.copy()
    DatabaseTable.update('container', {
      ecsState: 'updating',
      updated: new Date()
    }, {
      id: containerRecord.id
    })
  } else {
    containerRecord = await DatabaseTable.insert('container', {
      repo: watchedRepo.id,
      branch,
      isActive: true,
      ecsState: 'spinning up', // this shouldn't really happen here
      activeStart: new Date(),
      added: new Date()
    })
  }

  // get github client
  const repoConfig = await this.getConfig()

  // first take the time to do anything we can before stopping any old
  const containerUid = await initalTasks(watchedRepo, repoConfig)

  log.info('retrieving task definition')
  const getTaskDefinition = require('../../modules/AWS/ECS/get-task-definition')
  let taskDefinitionRevision = await getTaskDefinition(watchedRepo)
  // if no task definition registered, create one
  if (!taskDefinitionRevision) {
    throw new UnexpectedError('Task definition missing for existing task')
  }

  log.info('running task')
  const runTask = require('../../modules/AWS/ECS/run-task')
  const taskPending = await runTask(watchedRepo, taskDefinitionRevision)

  log.info('waiting for task to run')
  const waitForTask = require('../../modules/AWS/ECS/wait-for-task')
  const taskRunning = await waitForTask(taskPending)
  log.info('task running, via Fargate')

  log.info('getting public ip')
  const getTaskIp = require('../../modules/AWS/ECS/get-task-public-ip')
  const publicIp = await getTaskIp(taskRunning)

  // update record
  await DatabaseTable.update('container', {
    urlUid: containerUid,
    publicIp: publicIp,
    hostPort: repoConfig.machine.port, // todo: possibly assign dynaimc port?
    clusterArn: taskRunning.clusterArn,
    taskArn: taskRunning.taskArn,
    taskDefinitionArn: taskRunning.taskDefinitionArn,
    ecsState: 'running',
    updated: new Date()
  }, {
    id: containerRecord.id
  })

  // should _always_ have an old record, but safe > sorry
  if (oldRecord) {
    log.info('stopping old task')
    const stopTask = require('../../modules/AWS/ECS/stop-task')
    await stopTask(oldRecord.clusterArn, oldRecord.taskArn)
  }
}

/*
  handles any 'inital' tasks,
  meaning anything that has possible wait-time, and can be done
  before stopping any running tasks
  (this will help avoid dead-time of container cutover)
 */
function initalTasks(watchedRepo, repoConfig) {
  return new Promise(async resolve => {
    // build docker file
    const containerUid = await this.dockerBuild()

    // getting, and creating if needed, the ecr repo path in aws
    log.info('getting ECR repo record')

    const pushDockerBuild = require('../../modules/AWS/ECR/push-docker-build')
    const path = require('path')
    await pushDockerBuild(watchedRepo, path.resolve(__dirname, '..', '..', 'modules', 'git-container'))

    // checking if task definition is registered already
    log.info('checking for task definition')
    const getTaskDefinition = require('../../modules/AWS/ECS/get-task-definition')
    let taskDefinitionRevision = await getTaskDefinition(watchedRepo)
    // if no task definition registered, create one
    if (!taskDefinitionRevision) {
      log.info('no task definition - creating one')
      const registerTaskDefinition = require('../../modules/AWS/ECS/register-task-definition')
      taskDefinitionRevision = await registerTaskDefinition(watchedRepo, repoConfig)
    } else {
      log.info('task definition found')
    }

    // getting cluster info, in case it already exists
    log.info('checking for cluster')
    const getClusterData = require('../../modules/AWS/ECS/get-cluster-data')
    let cluster = await getClusterData(watchedRepo)
    // if no cluster, then create one
    if (!cluster) {
      log.info('no cluster found - creating one')
      const createCluster = require('../../modules/AWS/ECS/create-cluster')
      cluster = await createCluster(watchedRepo)
    } else {
      log.info('cluster found')
    }

    resolve(containerUid)
  })
}

module.exports = containerUpdate
