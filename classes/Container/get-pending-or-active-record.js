const { UnexpectedError } = require('@conjurelabs/err')

const log = require('../../modules/log')('container getPendingOrActiveRecord')

/*
  Gets active container record
  This will not return pending container records
 */
async function getPendingOrActiveRecord() {
  const { query, DatabaseRow } = require('@conjurelabs/db')

  // get watched repo record
  const watchedRepo = await this.payload.getWatchedRepoRecord()

  const { branch } = this.payload

  const containerResult = await query(`
    SELECT * FROM container
    WHERE repo = $1
    AND branch = $2
    AND (
      is_active = true
      OR ecs_state = 'pending'
    )
    AND creation_failed = FALSE
  `, [watchedRepo.id, branch])

  // not throwing, so things can still work
  // though > 1 container should not happen
  if (containerResult.rows.length > 1) {
    log.error(new UnexpectedError(`Multiple pending/active containers found for repo ${watchedRepo.id}, branch ${branch}`))
  }

  if (containerResult.rows.length) {
    return new DatabaseRow('container', containerResult.rows[0])
  }
  return null
}

module.exports = getPendingOrActiveRecord
