const Stripe = require('../');

const createCustomer = Symbol('create customer');
const updateCustomer = Symbol('update existing customer');

class Customer extends Stripe {
  constructor(conjureId, data, rawData) {
    super(...arguments);

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

  async save() {
    if (this.id) {
      return await this[updateCustomer]();
    }
    return await this[createCustomer]();
  }

  static async retrieve(conjureId, stripeId) {
    const customerData = await Customer.api.customers.retrieve(stripeId);

    return new Customer(conjureId, {
      id: customerData.id,
      email: customerData.email,
      name: customerData.metadata.name
    }, customerData));
  }

  async [createCustomer]() {
    const customerData = await Customer.api.customers.create({
      email: this.email,
      metadata: {
        conjureId: this.conjureId,
        name: this.name
      }
    });

    this.id = customerData.id;
    this.rawData = customerData;
    return this;
  }

  async [updateCustomer]() {
    const customerData = await Customer.api.customers.update(this.id, {
      email: this.email,
      metadata: {
        conjureId: this.conjureId,
        name: this.name
      }
    });

    this.rawData = customerData;
    return this;
  }
}

module.exports = Customer;
