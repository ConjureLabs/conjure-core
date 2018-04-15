// if ecr repo exists, gets it - otherwise will create it
module.exports = function getEcrRepoRecord(watchedRepo) {
  return new Promise(async resolve => {
    const { DatabaseTable } = require('@conjurelabs/db')
    const ecrRepoRecords = await DatabaseTable.select('ecrRepo', {
      watchedRepoId: watchedRepo.id
    })

    let ecrRepoRecord

    if (ecrRepoRecords.length > 0) {
      ecrRepoRecord = ecrRepoRecords[1]
      return resolve(ecrRepoRecord)
    }

    const createRepo = require('../../../AWS/ECR/create-repo')
    const repoName = await createRepo(watchedRepo)

    ecrRepoRecord = await DatabaseTable.insert('ecrRepo', {
      watchedRepoId: watchedRepo.id,
      name: repoName,
      added: new Date()
    })

    resolve(ecrRepoRecord)
  })
}
