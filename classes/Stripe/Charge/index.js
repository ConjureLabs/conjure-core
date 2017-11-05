const Stripe = require('../');

const createCharge = Symbol('create charge for custmer + card');
const updateCharge = Symbol('update existing charge');

class Charge extends Stripe {
  constructor(customerInstance, cardInstance, data, rawData) {
    super(...arguments);

    if (data.id) {
      this.id = data.id;
    }

    this.amount = data.amount;
    this.currency = data.currency;
    this.email = customerInstance.email;
    this.customer = customerInstance.id;
    this.source = cardInstance.id;

    if (rawData) {
      this.rawData = rawData;
    }
  }

  async save() {
    if (this.id) {
      return await this[updateCharge]();
    }
    return await this[createCharge]();
  }

  async [createCharge]() {
    const chargeData = await Charge.api.charges.create({
      amount: this.amount,
      currency: this.currency,
      receipt_email: this.email,
      customer: this.customer,
      source: this.source
    });

    this.id = chargeData.id;
    this.rawData = chargeData;

    return this;
  }

  async [updateCharge]() {
    const chargeData = await Charge.api.charges.update(this.id, {
      amount: this.amount,
      currency: this.currency,
      receipt_email: this.email,
      customer: this.customer,
      source: this.source
    });

    this.rawData = chargeData;
    return this;
  }
}

module.exports = Charge;
