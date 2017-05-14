const stripe = Symbol('internal Stripe alias');

class Stripe {
  constructor() {
    const appRoot = require('app-root-path');
    const config = require(`${appRoot}/modules/config`);
    this[stripe] = require('stripe')(config.stripe.secret);
  }
}

module.exports = Stripe;
