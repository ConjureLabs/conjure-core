const second = 1000
const minute = 60 * second
const hour = 60 * minute
const day = 24 * hour

const config = {
  app: {
    api: {
      domain: process.env.CONJURE_API_DOMAIN,
      host: null, // set later
      port: process.env.CONJURE_API_PORT,
      protocol: process.env.CONJURE_API_PROTOCOL,
      publicDomain: null, // set later
      publicHost: null, // set later
      publicUrl: null, // set later
      url: null // set later
    },

    web: {
      domain: process.env.CONJURE_WEB_DOMAIN,
      host: null, // set later
      port: process.env.CONJURE_WEB_PORT,
      protocol: process.env.CONJURE_WEB_PROTOCOL,
      url: null // set later
    },

    // not filling in worker with domain, host, etc, since it should be considered elastic/dynamic
    worker: {
      port: process.env.CONJURE_WORKER_PORT,
      protocol: process.env.CONJURE_WORKER_PROTOCOL
    }
  },

  aws: {
    account: {
      id: '657781215424'
    },

    accessKey: process.env.CONJURE_AWS_ACCESS_KEY,
    secretKey: process.env.CONJURE_AWS_SECRET_KEY,

    default: {
      region: 'us-east-1'
    },

    arn: {
      ecs: {
        executionRole: process.env.CONJURE_AWS_ARN_ECS_EXECUTION,
        taskRole: process.env.CONJURE_AWS_ARN_ECS_TASK
      }
    },

    ecs: {
      fargate: {
        prefix: `${process.env.NODE_ENV}-watched-`
      }
    },

    s3: {
      buckets: {
        gitHubPayloads: `${process.env.NODE_ENV}-gh-payload`
      }
    }
  },

  cookies: {
    secure: {
      cipherAlgorithm: process.env.CONJURE_SECURE_COOKIES_CIPHER_ALGO,
      cipherSecret: process.env.CONJURE_SECURE_COOKIES_CIPHER_SECRET,
      hmacAlgorithm: process.env.CONJURE_SECURE_COOKIES_HMAC_ALGO,
      hmacSecret: process.env.CONJURE_SECURE_COOKIES_HMAC_SECRET
    }
  },

  database: {
    pg: {
      user: process.env.CONJURE_PG_USER,
      database: process.env.CONJURE_PG_DB,
      password: process.env.CONJURE_PG_PASS,
      host: process.env.CONJURE_PG_HOST,
      port: 5432,
      max: 10,
      idleTimeoutMillis: 30000
    }
  },

  mq: {
    host: process.env.CONJURE_MQ_HOST,
    port: 5672,
    login: process.env.CONJURE_MQ_LOGIN,
    password: process.env.CONJURE_MQ_PASS,
    connectionTimeout: 10000,
    ssl: {
      enabled: process.env.CONJURE_MQ_SSL_ENABLED === 'false' ? false : true
    }
  },

  postmark: {
    enabled: parseInt(process.env.CONJURE_POSTMARK_ENABLED, 10) === 1,
    key: process.env.CONJURE_POSTMARK_KEY
  },

  redis: {
    port: process.env.CONJURE_REDIS_PORT,
    host: process.env.CONJURE_REDIS_HOST,
    password: process.env.CONJURE_REDIS_PASSWORD
  },

  services: {
    github: {
      app: {
        id: process.env.CONJURE_GITHUB_APP_ID,
        name: process.env.CONJURE_GITHUB_APP_NAME,
        pemPath: process.env.CONJURE_GITHUB_APP_PEM_PATH
      },

      oauth: {
        id: process.env.CONJURE_GITHUB_APP_OAUTH_ID,
        secret: process.env.CONJURE_GITHUB_APP_OAUTH_SECRET
      },

      webhook: {
        secret: process.env.CONJURE_GITHUB_APP_WEBHOOK_SECRET
      }
    }
  },

  session: {
    duration: 10 * day,
    secret: process.env.CONJURE_SESSION_SECRET
  },

  stripe: {
    enabled: process.env.CONJURE_STRIPE_ENABLED === 'false' ? false : true,
    secret: process.env.CONJURE_STRIPE_API_SECRET
  }
}

// fill in app.api
config.app.api.host = process.env.NODE_ENV === 'development' ? `${config.app.api.domain}:${config.app.api.port}` : config.app.api.domain
config.app.api.publicDomain = process.env.CONJURE_API_PUBLIC_HOST || config.app.api.domain
config.app.api.publicHost = process.env.NODE_ENV === 'development' ? `${config.app.api.publicDomain}:${config.app.api.port}` : config.app.api.publicDomain
config.app.api.publicUrl = `${config.app.api.protocol}://${config.app.api.publicHost}`
config.app.api.url = `${config.app.api.protocol}://${config.app.api.host}`

// fill in app.web
config.app.web.host = process.env.NODE_ENV === 'development' ? `${config.app.web.domain}:${config.app.web.port}` : config.app.web.domain
config.app.web.url = `${config.app.web.protocol}://${config.app.web.host}`

module.exports = config
