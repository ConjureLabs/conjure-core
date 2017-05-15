const Stripe = require('../');

const createCustomer = Symbol('create customer');
const updateCustomer = Symbol('update existing customer');

class Customer extends Stripe {
  constructor(conjureId, data, rawData) {
    if (data.id) {
      this.id = data.id;
    }
    this.conjureId = conjureId;
    this.email = data.email;
    this.name = data.name;

    if (rawData) {
      this.rawData = rawData;
    }
  }

  save(callback) {
    if (this.id) {
      return this[updateCustomer](callback);
    }
    return this[createCustomer](callback);
  }

  [createCustomer](callback) {
    Customer.api.customers.create({
      email: this.email,
      metadata: {
        conureId: this.conjureId,
        name: this.name
      }
    }, (err, customerData) => {
      if (err) {
        return callback(err);
      }

      this.id = customerData.id;
      this.rawData = customerData;
      callback(null, this);
    });

    return this;
  }

  [updateCustomer](callback) {
    Customer.api.customers.update(this.id, {
      email: this.email,
      metadata: {
        conjureId: this.conjureId,
        name: this.name
      }
    }, (err, customerData) => {
      this.rawData = customerData;
      return callback(err, this);
    });
  }
}

module.exports = Customer;
