const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

const config = {
  app: {
    api: {
      domain: process.env.CONJURE_API_DOMAIN,
      host: null, // set later
      port: process.env.CONJURE_API_PORT,
      protocol: process.env.CONJURE_API_PROTOCOL,
      publicDomain: null, // set later
      publicUrl: null, // set later
      url: null // set later
    },

    web: {
      domain: process.env.CONJURE_WEB_DOMAIN,
      host: null, // set later
      port: process.env.CONJURE_WEB_PORT,
      protocol: process.env.CONJURE_WEB_PROTOCOL,
      url: null // set later
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

  services: {
    github: {
      id: 'a2f05da23445befbe47a',
      secret: process.env.CONJURE_GITHUB_CLIENT_SECRET,
      inboundWebhookScret: 'super secret secret'
    }
  },

  session: {
    duration: 10 * day,
    secret: process.env.CONJURE_SESSION_SECRET
  },

  stripe: {
    secret: process.env.CONJURE_STRIPE_API_SECRET
  }
};

// fill in app.api
config.app.api.host = process.env.NODE_ENV === 'development' ? `${config.app.api.domain}:${config.app.api.port}` : config.app.api.domain;
config.app.api.publicDomain = process.env.CONJURE_API_PUBLIC_HOST || config.app.api.domain;
config.app.api.publicUrl = `${config.app.api.protocol}://${config.app.api.publicHost}`;
config.app.api.url = `${config.app.api.protocol}://${config.app.api.host}`;

// fill in app.web
config.app.web.host = process.env.NODE_ENV === 'development' ? `${config.app.web.domain}:${config.app.web.port}` : config.app.web.domain;
config.app.web.url = `${config.app.web.protocol}://${config.app.web.host}`;

module.exports = config;
