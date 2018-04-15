const { UnexpectedError } = require('@conjurelabs/err')

const log = require('../../modules/log')('container getActiveRecord')

async function getActiveRecord() {
  const { DatabaseTable } = require('@conjurelabs/db')

  const containerRecords = await DatabaseTable.select('container', {
    repo: watchedRepo.id,
    branch,
    isActive: true
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
