const cors = require('cors');
const config = require('conjure-core/modules/config');
const log = require('conjure-core/modules/log')('Route');

const requireAuthenticationWrapper = Symbol('Require Auth Wrapper');
const vanillaWrapper = Symbol('Vanilla (non-additive) Wrapper');

const corsOptions = {
  credentials: true,
  methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE', 'HEAD', 'OPTIONS'],
  optionsSuccessStatus: 200,
  origin: [
    config.app.api.url,
    config.app.web.url
  ],
  preflightContinue: true
}

class Route extends Array {
  constructor(options) {
    super();

    this.suppressedRoutes = false;

    options = options || {};
    options.blacklistedEnv = options.blacklistedEnv || {};

    this.requireAuthentication = options.requireAuthentication === true;
    this.wildcardRoute = options.wildcard === true;

    this.skippedHandler = options.skippedHandler || null;

    this.directCache = null; // filled on first .direct call

    for (let key in options.blacklistedEnv) {
      const envVar = process.env[key];
      const blacklistedArray = options.blacklistedEnv[key];

      if (envVar && blacklistedArray.includes(envVar)) {
        this.suppressedRoutes = true;
        break;
      }
    }
  }

  [requireAuthenticationWrapper](handler) {
    const skippedHandler = this.skippedHandler;

    return function(req, res, next) {
      if (!req.isAuthenticated()) {
        if (typeof skippedHandler === 'function') {
          return skippedHandler.apply(this, arguments);
        }
        return next();
      }

      handler.apply(this, arguments);
    };
  }

  [vanillaWrapper](handler) {
    return handler;
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
      log.info(verb.toUpperCase(), expressPathUsed);

      // see https://github.com/expressjs/cors#enabling-cors-pre-flight
      router.options(expressPathUsed, cors(corsOptions));
      router[expressVerb](expressPathUsed, cors(corsOptions), (
        this.requireAuthentication ? this[requireAuthenticationWrapper](this[i]) : this[i]
      ));
    }

    return router;
  }

  direct(req, callback) {
    // if task workers already available, start flow
    if (Array.isArray(this.directTasksCache)) {
      const waterfall = require('conjure-core/modules/async/waterfall');
      waterfall(this.directTasksCache, callback);
      return this;
    }

    // build up a cache on task workers
    this.directTasksCache = [].concat(this).map(handler => {
      return (callback, breakFlow) => {
        const resProxy = {
          send: data => {
            breakFlow(data);
          }
        };

        handler(req, resProxy, err => {
          if (err) {
            return callback(err);
          }

          callback();
        });
      };
    });

    // now that this.directTasksCache is filled in, re-run this method to cause it to start
    return this.direct(req, callback);
  }
}

module.exports = Route;
