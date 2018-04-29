const { UnexpectedError } = require('@conjurelabs/err')

const log = require('../../modules/log')('container getActiveRecord')

/*
  Gets active container record
  This will not return pending container records
 */
async function getActiveRecord() {
  const { DatabaseTable } = require('@conjurelabs/db')

  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  const { branch } = this.payload

  const containerRecords = await DatabaseTable.select('container', {
    repo: watchedRepo.id,
    branch,
    isActive: true,
    creationFailed: false
  })

  // not throwing, so things can still work
  // though > 1 active container should not happen
  if (containerRecords.length > 1) {
    log.error(new UnexpectedError(`Multiple active containers found for repo ${watchedRepo.id}, branch ${branch}`))
  }

  if (containerRecords.length) {
    return containerRecords[0]
  }
  return null
}

module.exports = getActiveRecord
