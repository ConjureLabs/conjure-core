const { UnexpectedError } = require('@conjurelabs/err')
const log = require('../../modules/log')('container start')

/*
  Starts a stopped conatiner
  This will fail if a container, in a stopped state, does not exist
 */
async function containerStart() {
  log.info('starting container')

  const { branch } = this.payload

  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  const { DatabaseTable } = require('@conjurelabs/db')
  // make sure the repo/branch is in the correct state
  const stoppedContainerRecords = await DatabaseTable.select('container', {
    repo: watchedRepo.id,
    branch,
    isActive: false,
    ecsState: 'stopped'
  })

  if (!stoppedContainerRecords.length) {
    // no container record to start back up - so create one
    return this.create()
  }

  const containerRecord = stoppedContainerRecords[0]

  // update db record, since spinning up
  await DatabaseTable.update('container', {
    ecsState: 'spinning up',
    isActive: true,
    updated: new Date()
  }, {
    id: containerRecord.id
  })

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

  // update db record
  await DatabaseTable.update('container', {
    ecsState: 'running',
    taskArn: taskRunning.taskArn,
    publicIp: publicIp,
    updated: new Date()
  }, {
    id: containerRecord.id
  })
}

module.exports = containerStart
