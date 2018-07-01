const { UnexpectedError } = require('@conjurelabs/err')
const log = require('../../modules/log')('container stop')

/*
  Stops an active container
 */
async function containerStop() {
  log.info('stopping container')

  const { DatabaseTable } = require('@conjurelabs/db')
  // make sure the repo/branch is in the correct state
  const containerRecord = await this.getActiveRecord()
  if (!containerRecord) {
    // no container record to start back up
    return
  }

  // update db record, since spinning down
  await DatabaseTable.update('container', {
    ecsState: 'spinning down',
    updated: new Date()
  }, {
    id: containerRecord.id
  })

  log.info('stopping task')
  const stopTask = require('../../modules/AWS/ECS/stop-task')
  await stopTask(containerRecord.clusterArn, containerRecord.taskArn)

  const endDate = new Date()

  // update db record
  await DatabaseTable.update('container', {
    ecsState: 'stopped',
    isActive: false,
    taskArn: null,
    publicIp: null,
    activeEnd: endDate,
    updated: new Date()
  }, {
    id: containerRecord.id
  })
  
  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  tlogRecordRan(containerRecord, watchedRepo, endDate)
}

/*
  Stores billable transaction record that a container had run
 */
async function tlogRecordRan(containerRecord, watchedRepo, endDate) {
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
    action: 'ran',
    actionStart: containerRecord.activeStart,
    actionEnd: endDate,
    added: new Date()
  })
}

module.exports = containerStop
