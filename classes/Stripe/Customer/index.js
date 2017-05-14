const Stripe = require('../');

const createCustomer = Symbol('create customer');
const updateCustomer = Symbol('update existing customer');

class Customer extends Stripe {
  constructor(data, rawData) {
    if (data.id) {
      this.id = data.id;
    }
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
        name: this.name
      }
    }, (err, customer) => {
      this.rawData = customer;
      return callback(err, this);
    });
  }

  static fetch(id, callback) {
    Customer.api.customers.retrieve(id, (err, customerData) => {
      if (err) {
        return callback(err);
      }

      callback(null, new Customer({
        id: customerData.id,
        email: customerData.email,
        name: (customerData.metadata || {}).name
      }, customerData));
    });

    return this;
  }
}

module.exports = Customer;
