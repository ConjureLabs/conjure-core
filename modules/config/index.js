'use strict';

const config = {
  app: {
    domain: 'localhost',
    host: null, // set later
    port: process.env.PORT,
    protocol: 'http',
    publicHost: null, // set later
    publicUrl: null, // set later
    url: null // set later
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

config.app.host = `${config.app.domain}:${process.env.PORT}`;
config.app.publicHost = process.env.CONJURE_APP_PUBLIC_HOST || config.app.host;
config.app.publicUrl = `${config.app.protocol}://${config.app.publicHost}`;
config.app.url = `${config.app.protocol}://${config.app.host}`;

module.exports = config;