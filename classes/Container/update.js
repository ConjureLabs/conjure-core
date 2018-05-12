const log = require('../../modules/log')('container update')
const { UnexpectedError } = require('@conjurelabs/err')

/*
  Updates an active container
  If an active container does not exist, this will create one.
  If a pending container exists, this will update it directly to spinning up state.
 */
async function containerUpdate() {
  log.info('starting update')

  const { branch } = this.payload

  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  let containerRecord = await this.getPendingOrActiveRecord()
  let oldRecord

  const { DatabaseTable } = require('@conjurelabs/db')

  const actionDate = new Date()

  let heartbeat

  if (containerRecord && containerRecord.isActive === true) {
    oldRecord = containerRecord.copy()
    DatabaseTable.update('container', {
      ecsState: 'updating',
      updated: actionDate
    }, {
      id: containerRecord.id
    })
  } else {
    if (containerRecord) {
      // update existing pending record
      containerRecord
        .set({
          ecsState: 'spinning up',
          isActive: true,
          activeStart: actionDate,
          updated: actionDate
        })
        .save()
    } else {
      // fallback - create a new container
      containerRecord = await DatabaseTable.insert('container', {
        repo: watchedRepo.id,
        branch,
        isActive: true,
        ecsState: 'spinning up', // this shouldn't really happen here
        activeStart: actionDate,
        added: actionDate
      })
    }

    // only doing a heartbeat if on a non-active container
    // update heartbeat every minute
    heartbeat = setInterval(function() {
      containerRecord
        .set({
          creationHeartbeat: new Date(),
          updated: new Date()
        })
        .save()
    }, 60 * 1000) // every minute
  }

  // todo: heartbeat?

  // get github client
  const repoConfig = await this.getConfig()

  // first take the time to do anything we can before stopping any old
  const containerUid = await initialTasks(this.dockerBuild.bind(this), watchedRepo, repoConfig)

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

  // end heartbeat
  if (heartbeat) {
    clearInterval(heartbeat)
  }

  // should _always_ have an old record, but safe > sorry
  if (oldRecord) {
    log.info('stopping old task')
    const stopTask = require('../../modules/AWS/ECS/stop-task')
    await stopTask(oldRecord.clusterArn, oldRecord.taskArn)
  }

  tlogRecordBuild(containerRecord, watchedRepo, actionDate)
}

/*
  Stores billable transaction record that a container was built
 */
async function tlogRecordBuild(containerRecord, watchedRepo, actionDate) {
  const { DatabaseTable } = require('@conjurelabs/db')

  const orgBillingPlanRecords = await DatabaseTable.select('githubOrgBillingPlan', {
    org: watchedRepo.org,
    deactivated: null
  })

  // todo: should kill build / run flow if no billing plan is found
  // todo: check for billing plan before build/run maybe?
  if (orgBillingPlanRecords.length === 0) {
    throw new UnexpectedError(`No billing plan found for repo ${watchedRepo.org}/${watchedRepo.name}`)
  }

  const billingPlan = orgBillingPlanRecords[0]

  DatabaseTable.insert('containerTransactionLog', {
    container: containerRecord.id,
    billingPlan: billingPlan.id,
    action: 'build',
    actionStart: actionDate,
    actionEnd: new Date(),
    added: new Date()
  })
}

/*
  handles any 'inital' tasks,
  meaning anything that has possible wait-time, and can be done
  before stopping any running tasks
  (this will help avoid dead-time of container cutover)
 */
function initialTasks(dockerBuild, watchedRepo, repoConfig) {
  return new Promise(async resolve => {
    // build docker file
    const containerUid = dockerBuild()

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
