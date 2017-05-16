const config = require('conjure-core/modules/config');
const stripeApi = require('stripe')(config.stripe.secret);

class Stripe {
  static get api() {
    return stripeApi;
  }
}

module.exports = Stripe;
