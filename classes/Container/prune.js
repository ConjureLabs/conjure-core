const log = require('../../modules/log')('container prune')

/*
  Prunes all reasources when a container is destroyed
 */
async function containerPrune() {
  log.info('pruning container')

  // todo: cleanup all aws resources
}

module.exports = containerPrune
