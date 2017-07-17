### Route

This class is used to construct the API and Views routes

Express route handlers are pushed into a `Route` instance.

The route verbs will be gathered from the filenames (like `get.js` or `patch.js`), and the full route tree will be constructed during the sync setup.

```js
const Route = require('classes/Route');

const route = new Route();

route.push((req, res, next) => {
  next();
});

module.exports = route;
```

#### Options

##### Require Authentication

If you want a route to only be accessible if the user is authenticated, then use:

```js
const route = new Route({
  requireAuthentication: true
});
```

##### Blacklisted Env Vars

If you want to block a route from being using when an ENV var is set, you can do so like:

```js
const route = new Route({
  blacklistedEnv: {
    NODE_ENV: ['test', 'production']
  }
});

route.push((req, res, next) => {
  // this will not be accessible if process.env.NODE_ENV is 'test' or 'production'
});

module.exports = route;
```

##### Wildcard

If you want to catch-all (e.g. `/some/route/*` instead of `/some/route`) then you can set `wildcard: true`.

```js
const route = new Route({
  wildcard: true
});

route.push((req, res, next) => {
  // ...
});

module.exports = route;
```

##### Skipped Handler

If a route is skipped, because of invalid criteria like not passing `requireAuthentication`, then it will, by default, call `next()` in the Express routes. To override that, you can supply `skippedHandler`.

```js
const route = new Route({
  requireAuthentication: true,
  skippedHandler: (req, res, next) => {
    // ...
  }
});

route.push((req, res, next) => {
  // if this route is not executed, because the user is not authed, then `skippedHandler` will be called instead of `next`
});
```

#### Child Overrides

##### Modifying route before passing to Express

You can alter anything within the `this` namespace (including the handlers, since it is an array) by creating a child class that extends `Route`, and providing an override method for `expressRouterPrep`.

`expressRouterPrep` is called at the start of `expressRouter`.

#### Directly passing (req, res, next)

If you have a route that you want to kick the `req`, `res` and `next` objects into a `Route` instance, you can do so by using `.process`.

```js
route.push((req, res, next) => {
  const getOrgsApi = require('conjure-api/server/routes/api/orgs/get.js');

  getOrgsApi.process(req, res, next); // this will now have the identical outcome a
});
```

#### Server-side Calls

If have a repo like API, and want to install the module within another repo (say, web) and call it, you can do so by passing the parent repo's route request object, and a callback.

```js
// this is assumed to be within a parent repo
route.push((req, res, next) => {
  const getOrgsApi = require('conjure-api/server/routes/api/orgs/get.js');

  getOrgsApi.call(req, { arg: 'val' }, (err, result) => {
    // ...
  });
});
```

It is possible that the `.call` callback will not receive any data, if (within the route) `next` is called, and `res.send` is never fired.
