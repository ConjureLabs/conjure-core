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

  save(callback) {
    if (this.id) {
      return this[updateCharge](callback);
    }
    return this[createCharge](callback);
  }

  [createCharge](callback) {
    Customer.api.charges.create({
      amount: this.amount,
      currency: this.currency,
      receipt_email: this.email,
      customer: this.customer,
      source: this.source
    }, (err, chargeData) => {
      if (err) {
        return callback(err);
      }

      this.id = chargeData.id;
      this.rawData = chargeData;
      callback(null, this);
    });

    return this;
  }

  [updateCharge](callback) {
    Customer.api.charges.update(this.id, {
      amount: this.amount,
      currency: this.currency,
      receipt_email: this.email,
      customer: this.customer,
      source: this.source
    }, (err, chargeData) => {
      this.rawData = chargeData;
      return callback(err, this);
    });
  }
}

module.exports = Charge;
