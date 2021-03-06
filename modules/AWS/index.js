const config = require('../config')
const AWS = require('aws-sdk')

AWS.config.update({
  accessKeyId: config.aws.accessKey,
  secretAccessKey: config.aws.secretKey,
  region: config.aws.default.region
})

module.exports = AWS
