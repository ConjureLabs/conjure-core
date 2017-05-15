const appRoot = require('app-root-path');
const config = require(`${appRoot}/modules/config`);
const stripeApi = require('stripe')(config.stripe.secret);

class Stripe {
  static get api() {
    return stripeApi;
  }
}

module.exports = Stripe;
