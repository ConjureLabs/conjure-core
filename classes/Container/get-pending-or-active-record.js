const { UnexpectedError } = require('@conjurelabs/err')

const log = require('../../modules/log')('container getPendingOrActiveRecord')

/*
  Gets active container record
  This will not return pending container records
 */
async function getPendingOrActiveRecord() {
  const { query } = require('@conjurelabs/db')

  const containerResult = await query(`
    SELECT * FROM container
    WHERE repo = $1
    AND branch = $1
    AND (
      is_active = true
      OR ecs_state = 'pending'
    )
  `, [watchedRepo.id, branch])

  // not throwing, so things can still work
  // though > 1 container should not happen
  if (containerResult.rows.length > 1) {
    log.error(new UnexpectedError(`Multiple pending/active containers found for repo ${watchedRepo.id}, branch ${branch}`))
  }

  if (containerResult.rows.length) {
    return containerResult.rows[0]
  }
  return null
}

module.exports = getPendingOrActiveRecord