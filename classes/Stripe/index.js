const stripe = Symbol('private stripe key');

class Stripe {
  static get api() {
    const appRoot = require('app-root-path');
    const config = require(`${appRoot}/modules/config`);
    const stripe = require('stripe');
    return stripe(config.stripe.secret);
  }
}

module.exports = Stripe;
