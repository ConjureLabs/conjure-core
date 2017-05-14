const Stripe = require('../');

const create = Symbol('create new stripe customer');
const update = Symbol('update existing stripe customer');
const customerViaStripeData = Symbol('generate customer class from raw stripe data');

const keys = {
  id: {
    stripe: 'id',
    applied: {
      create: false,
      update: false
    }
  },

  accountBalance: {
    stripe: 'account_balance',
    applied: {
      create: false,
      updated: false
    }
  },

  businessVatId: {
    stripe: 'business_vat_id'
  },

  created: {
    stripe: 'created'
  },

  currency: {
    stripe: 'currency'
  },

  delinquent: {
    stripe: 'delinquent'
  },

  description: {
    stripe: 'description'
  },

  discount: {
    stripe: 'discount'
  },

  email: {
    stripe: 'email'
  },

  livemode: {
    stripe: 'livemode'
  },

  metadata: {
    stripe: 'metadata'
  },

  source: {
    stripe: 'sources'
  },

  subscriptions: {
    stripe: 'subscriptions'
  }
};

class Customer extends Stripe {
  constructor(data = {}) {
    for (let key in data) {
      this[key] = data[key];
    }
    this.raw = null;
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
    Stripe.api.customers.create(this, (err, customerData) => {
      callback(err, this[customerViaStripeData](customerData));
    });
  }

  [update](callback) {
    Stripe.api.customers.update(this.id, Object.assign({}, this, {
      id: null
    }), (err, customerData) => {
      callback(err, this[customerViaStripeData](customerData));
    });
  }

  retrieve(callback) {
    if (!this.id) {
      return callback(new Error('Expected .id for retrieval'));
    }

    Stripe.api.customers.retrieve(this.id, (err, customerData) => {
      callback(err, this[customerViaStripeData](customerData));
    });
  }

  delete(callback) {
    if (!this.id) {
      return callback(new Error('Expected .id for deletion'));
    }

    Stripe.api.customers.del(this.id, (err, confirmation) => {
      callback(err, confirmation);
    });
  }

  [customerViaStripeData](customerData) {
    const customer = new Customer(customerData);
    customer.raw = customerData;
    return customer;
  }
}

module.exports = Stripe;
