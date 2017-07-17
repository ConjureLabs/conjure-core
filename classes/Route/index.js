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

    log.info(verb.toUpperCase(), expressPathUsed);

    for (let i = 0; i < this.length; i++) {
      // see https://github.com/expressjs/cors#enabling-cors-pre-flight
      router.options(expressPathUsed, cors(corsOptions));
      router[expressVerb](expressPathUsed, cors(corsOptions), (
        this.requireAuthentication ? this[requireAuthenticationWrapper](this[i]) : this[i]
      ));
    }

    return router;
  }

  process(req, res, next) {
    const stack = [];

    for (let i = 0; i < this.length; i++) {
      stack.push(this.requireAuthentication ? this[requireAuthenticationWrapper](this[i]) : this[i]);
    }

    // build up a cache on task workers
    const tasks = stack.map(handler => {
      return cb => {
        handler(req, res, err => {
          if (err) {
            return cb(err);
          }

          cb();
        });
      };
    });

    const waterfall = require('conjure-core/modules/async/waterfall');
    waterfall(tasks, next);
    return this;
  }

  call(req, args, callback) {
    args = args == null ? {} : args;

    req = Object.assign({}, req, {
      body: args,
      query: args
    });

    // build up a cache on task workers
    const tasks = [].concat(this).map(handler => {
      return (cb, breakFlow) => {
        const resProxy = {
          send: data => {
            breakFlow(data);
          }
        };

        handler(req, resProxy, err => {
          if (err) {
            return cb(err);
          }

          cb();
        });
      };
    });

    const waterfall = require('conjure-core/modules/async/waterfall');
    waterfall(tasks, (err, data) => {
      callback(err, data);
    });
    return this;
  }
}

module.exports = Route;
