const { UnexpectedError } = require('@conjurelabs/err')

const log = require('../../modules/log')('container getPendingRecord')

/*
  Gets a pending container record
  Assumes isActive can not be true
 */
async function getPendingRecord() {
  const { DatabaseTable } = require('@conjurelabs/db')

  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  const { branch } = this.payload

  const containerRecords = await DatabaseTable.select('container', {
    repo: watchedRepo.id,
    branch,
    isActive: false,
    ecsState: 'pending',
    creationFailed: false
  })

  // not throwing, so things can still work
  // though > 1 pending container should not happen
  if (containerRecords.length > 1) {
    log.error(new UnexpectedError(`Multiple pending containers found for repo ${watchedRepo.id}, branch ${branch}`))
  }

  if (containerRecords.length) {
    return containerRecords[0]
  }
  return null
}

module.exports = getPendingRecord
