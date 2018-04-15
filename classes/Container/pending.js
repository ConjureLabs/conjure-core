const { UnexpectedError } = require('@conjurelabs/err')
const log = require('../../modules/log')('container pending')

async function containerStart() {
  log.info('creating pending container')

  const { branch } = this.payload

  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  // make sure the repo/branch is not already in progress
  let existingContainer = await this.getActiveRecord()
  if (existingContainer) {
    throw new UnexpectedError(`Active container record already exists for repo ${watchedRepo.id}, branch ${branch}`)
  }

  existingContainer = await this.getPendingRecord()
  if (existingContainer) {
    throw new UnexpectedError(`Pending container record already exists for repo ${watchedRepo.id}, branch ${branch}`)
  }

  const { DatabaseTable } = require('@conjurelabs/db')

  // create record for container
  const insertedContainer = await DatabaseTable.insert('container', {
    repo: watchedRepo.id,
    branch,
    isActive: false,
    ecsState: 'pending',
    added: new Date()
  })

  return insertedContainer
}

module.exports = containerStart
