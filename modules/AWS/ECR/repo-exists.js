const repoDoesNotExistExpr = /^The repository .* does not exist/
const policyDoesNotExist = /^Repository policy does not exist for the repository/

// checks if the ECR repo exists
module.exports = function repoExists(watchedRepoRecord) {
  return new Promise((resolve, reject) => {
    const getRepoName = require('./get-repo-name')
    const repoName = getRepoName(watchedRepoRecord)

    const AWS = require('../')
    const ecr = new AWS.ECR()

    // see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/ECR.html#getRepositoryPolicy-property
    // using this method since no getRepository or defineResository method exists
    ecr.getRepositoryPolicy({
      repositoryName: repoName
    }, err => {
      if (err) {
        // 'The repository with name \'conjure/development-watched-1\' does not exist in the registry with id \'657781215424\''
        if (err.message) {
          if (repoDoesNotExistExpr.test(err.message)) {
            resolve(false)
            return
          } else if (policyDoesNotExist.test(err.message)) {
            resolve(true)
            return
          }
        }
        reject(err)
      }

      resolve(true)
    })
  })
}
