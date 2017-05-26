const config = {
  app: {
    api: {
      domain: 'localhost',
      host: null, // set later
      port: process.env.APP_API_PORT,
      protocol: 'http',
      publicHost: null, // set later
      publicUrl: null, // set later
      url: null // set later
    },

    web: {
      domain: 'localhost',
      host: null, // set later
      port: process.env.APP_WEB_PORT,
      protocol: 'http',
      url: null // set later
    }
  },

  database: {
    pg: {
      user: 'conjure_admin',
      database: 'conjure',
      password: null,
      host: 'localhost',
      port: 5432,
      max: 10,
      idleTimeoutMillis: 30000
    }
  },

  services: {
    github: {
      id: 'a2f05da23445befbe47a',
      secret: process.env.GITHUB_CLIENT_SECRET,
      inboundWebhookScret: 'super secret secret'
    }
  },

  stripe: {
    secret: process.env.STRIPE_API_SECRET
  }
};

// fill in app.api
config.app.api.host = `${config.app.api.domain}:${config.app.api.port}`;
config.app.api.publicHost = process.env.CONJURE_API_PUBLIC_HOST || config.app.api.host;
config.app.api.publicUrl = `${config.app.api.protocol}://${config.app.api.publicHost}`;
config.app.api.url = `${config.app.api.protocol}://${config.app.api.host}`;

// fill in app.web
config.app.web.host = `${config.app.web.domain}:${config.app.web.port}`;
config.app.web.url = `${config.app.web.protocol}://${config.app.web.host}`;

module.exports = config;
