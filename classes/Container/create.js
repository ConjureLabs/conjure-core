const { ContentError, UnexpectedError } = require('@conjurelabs/err')
const path = require('path')
const log = require('../../modules/log')('container create')

async function containerCreate() {
  log.info('starting create')

  const { branch } = this.payload
  const { DatabaseTable } = require('@conjurelabs/db')
  
  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  // make sure the repo/branch is not already in progress
  let containerRecord = await this.getActiveRecord()
  if (containerRecord && containerRecord.ecsState !== 'pending') {
    return containerRecord.urlUid
  }

  // get github client
  const repoConfig = await this.getConfig()

  if (containerRecord) {
    // update existing pending record
    containerRecord
      .set({
        ecsState: 'spinning up',
        updated: new Date()
      })
      .save()
  } else {
    // create record for container
    const insertedContainer = await DatabaseTable.insert('container', {
      repo: watchedRepo.id,
      branch,
      isActive: true,
      ecsState: 'spinning up',
      activeStart: new Date(),
      added: new Date()
    })

    if (!Array.isArray(insertedContainer) || !insertedContainer.length) {
      throw UnexpectedError('Container record failed to insert')
    }

    containerRecord = insertedContainer[0]
  }

  const containerUid = await this.dockerBuild()

  const fargateResponse = await spinUpProject(watchedRepo, repoConfig)

  // update reference for container
  await DatabaseTable.update('container', {
    urlUid: containerUid,
    publicIp: fargateResponse.publicIp,
    hostPort: fargateResponse.hostPort,
    clusterArn: fargateResponse.clusterArn,
    taskArn: fargateResponse.taskArn,
    taskDefinitionArn: fargateResponse.taskDefinitionArn,
    isActive: true,
    ecsState: 'running',
    updated: new Date()
  }, {
    id: containerRecord.id
  })

  return containerUid
}

/*
  spins up a project on AWS, via ECS/ECR/Fargate
  1. register ECR repo, so we can docker push into it
  2. docker push into ECR
  3. register ECS task definition for this repo
  4. create ECS cluster for this repo
  5. run ECS task, based on definition, within the created cluster
 */
function spinUpProject(watchedRepo, repoConfig) {
  return new Promise(async resolve => {
    // getting, and creating if needed, the ecr repo path in aws
    log.info('getting ECR repo record')

    const pushDockerBuild = require('../../modules/AWS/ECR/push-docker-build')
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

    // run the task, in the cluster
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

    resolve({
      hostPort: repoConfig.machine.port, // todo: possibly assign dynaimc port?
      clusterArn: taskRunning.clusterArn,
      taskArn: taskRunning.taskArn,
      taskDefinitionArn: taskRunning.taskDefinitionArn,
      publicIp
    })
  })
}

module.exports = containerCreate
