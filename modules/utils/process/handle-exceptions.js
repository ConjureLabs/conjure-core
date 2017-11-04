/*
  simply require in this util to have various exceptions & warning handled

  this is necessary for any app with a node server running.
 */

// log fatal exceptions
process.on('uncaughtException', err => {
  const errType = err.constructor.name;

  console.error(`Uncaught ${errType}:`, err);

  // die
  process.nextTick(() => {
    process.exit();
  });
});

// log uncaught rejections
// todo: possibly alter this - read https://nodejs.org/api/process.html#process_event_rejectionhandled
process.on('unhandledRejection', (reason, p /* promise */) => {
  console.error('Unhandled Rejection at:', p, `

reason: `, reason);
});

process.on('warning', warning => {
  console.warn(warning.name);
  console.warn(warning.message);
  console.warn(warning.stack);
});
