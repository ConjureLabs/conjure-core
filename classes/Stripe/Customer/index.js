const Stripe = require('../');

const create = Symbol('create new stripe customer');
const update = Symbol('update existing stripe customer');

class Customer extends Stripe {
  constructor(data = {}) {
    for (let key in data) {
      this[key] = data[key];
    }
  }

  /*
    .save is an upsert
    it will either
      A) update an existing Stripe Customer record (if .id is present)
      B) create a new Stripe Customer (.id not present)
   */
  save(callback) {
    if (this.id) {
      return this[update](callback);
    }
    this[create](callback);
  }

  [create](callback) {
    
  }

  [update](callback) {
    
  }
}

module.exports = Stripe;
