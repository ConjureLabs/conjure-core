const Stripe = require('../');

const createCard = Symbol('create card');
const updateCard = Symbol('update existing card');

class Card extends Stripe {
  constructor(customerInstance, data, rawData) {
    if (data.id) {
      this.id = data.id;
    }

    this.cvc = data.cvc;
    this.name = data.name;
    this.number = data.number;

    const expiration = data.expiration || {};
    this.expiration = {
      month: expiration.month,
      year: expiration.year
    };

    const address = data.address || {};
    this.address = {
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      country: address.country
    };


    if (rawData) {
      this.rawData = rawData;
    }
  }

  save(callback) {
    if (this.id) {
      return this[updateCard](callback);
    }
    return this[createCard](callback);
  }

  [createCard](callback) {
    Customer.api.customers.createSource(customerInstance.id, {
      source: {
        object: 'card',
        exp_month: this.expiration.month,
        exp_year: this.expiration.year,
        number: this.number,
        address_city: this.address.city,
        address_country: this.address.country,
        address_line1: this.address.line1,
        address_line2: this.address.line2,
        address_state: this.address.state,
        address_zip: this.address.zip,
        cvc: this.cvc,
        name: this.name
      }
    }, (err, cardData) => {
      if (err) {
        return callback(err);
      }

      this.id = cardData.id;
      this.rawData = cardData;
      callback(null, this);
    });

    return this;
  }

  [updateCard](callback) {
    Customer.api.customers.updateCard(customerInstance.id, this.id, {
      source: {
        object: 'card',
        exp_month: this.expiration.month,
        exp_year: this.expiration.year,
        number: this.number,
        address_city: this.address.city,
        address_country: this.address.country,
        address_line1: this.address.line1,
        address_line2: this.address.line2,
        address_state: this.address.state,
        address_zip: this.address.zip,
        cvc: this.cvc,
        name: this.name
      }
    }, (err, cardData) => {
      this.rawData = cardData;
      return callback(err, this);
    });
  }
}

module.exports = Card;
