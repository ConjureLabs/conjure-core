const cors = require('cors');
const config = require('../../modules/config');
const log = require('../../modules/log')('Route');

const requireAuthenticationWrapper = Symbol('Require Auth Wrapper');
const wrapWithExpressNext = Symbol('Wrap async handlers with express next()');

const corsOptions = {
  credentials: true,
  methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
  optionsSuccessStatus: 200,
  origin: [
    config.app.api.url,
    config.app.web.url
  ],
  preflightContinue: true
};

class Route extends Array {
  constructor(options = {}) {
    super();

    this.suppressedRoutes = false;

    options.blacklistedEnv = options.blacklistedEnv || {};

    this.requireAuthentication = options.requireAuthentication === true;
    this.wildcardRoute = options.wildcard === true;

    this.skippedHandler = options.skippedHandler || null;

    this.process = this.process.bind(this);
    this.call = this.call.bind(this);

    for (let key in options.blacklistedEnv) {
      const envVar = process.env[key];
      const blacklistedArray = options.blacklistedEnv[key];

      if (envVar && blacklistedArray.includes(envVar)) {
        this.suppressedRoutes = true;
        break;
      }
    }
  }

  async [requireAuthenticationWrapper](handler) {
    const skippedHandler = this.skippedHandler;

    return async function(req, res) {
      if (!req.isAuthenticated()) {
        if (typeof skippedHandler === 'function') {
          return await skippedHandler.apply(this, arguments);
        }
        return;
      }

      if (!req.user) {
        throw new UnexpectedError('No req.user available');
      }

      return await handler.apply(this, arguments);
    };
  }

  [wrapWithExpressNext](handler) {
    return async (req, res, next) => {
      const originalSend = res.send;
      let sent = false;

      res.send = function(...args) {
        sent = true;
        originalSend.apply(this, args);
      };

      try {
        await handler(req, res);
      } catch(err) {
        return next(err);
      }

      // if res.send was called, kill the express flow
      if (sent === true) {
        return;
      }

      next();
    };
  }

  expressRouterPrep() {
    // placeholder
  }

  expressRouter(verb, expressPath) {
    this.expressRouterPrep();

    const express = require('express');
    const router = express.Router();

    if (this.suppressedRoutes === true) {
      return router;
    }

    const expressPathUsed = this.wildcardRoute ? expressPath.replace(/\/$/, '') + '*' : expressPath;
    const expressVerb = verb.toLowerCase();

    for (let i = 0; i < this.length; i++) {
      // see https://github.com/expressjs/cors#enabling-cors-pre-flight
      router.options(expressPathUsed, cors(corsOptions));
      router[expressVerb](expressPathUsed, cors(corsOptions), this[wrapWithExpressNext](
        this.requireAuthentication ? this[requireAuthenticationWrapper](this[i]) : this[i]
      ));
    }

    return router;
  }

  async process(req, res) {
    const tasks = [];

    for (let i = 0; i < this.length; i++) {
      tasks.push(this.requireAuthentication ? this[requireAuthenticationWrapper](this[i]) : this[i]);
    }

    for (let i = 0; i < tasks.length; i++) {
      await tasks[i](req, res);
    }
  }

  async call(req, args = {}) {
    req = Object.assign({}, req, {
      body: args,
      query: args
    });

    const tasks = [].concat(this);

    for (let i = 0, i < tasks.length; i++) {
      const resProxy = {
        send: data => new directCallResponse(data)
      };
      
      const taskResult = await tasks[i](req, resProxy);

      if (taskResult && taskResult instanceof directCallResponse) {
        return directCallResponse.data;
      }
    }
  }
}

class directCallResponse {
  constructor(data) {
    this.data = data;
  }
}

module.exports = Route;
