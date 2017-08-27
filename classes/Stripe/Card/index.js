const Stripe = require('../');
const UnexpectedError = require('conjure-core/modules/err').UnexpectedError;
const ContentError = require('conjure-core/modules/err').ContentError;

const createCard = Symbol('create card');
const updateCard = Symbol('update existing card');

// todo: this class is used for entry (full data) and summaries (partial, & last4), which is confusing - should get refactored
class Card extends Stripe {
  constructor(customerInstance, data, rawData) {
    super(...arguments);

    if (data.id) {
      this.id = data.id;
    }

    this.customer = customerInstance;

    this.cvc = data.cvc;
    this.name = data.name;
    this.number = data.number;

    // last4 and brand are used for summaries, not for entry
    this.last4 = data.last4;
    this.brand = data.brand;

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
    if (!this.customer || !this.customer.id) {
      return callback(new UnexpectedError('No stripe customer id present'));
    }

    Card.api.customers.createSource(this.customer.id, {
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
    if (!this.customer || !this.customer.id) {
      return callback(new UnexpectedError('No stripe customer id present'));
    }

    Card.api.customers.updateCard(this.customer.id, this.id, {
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

  static retrieve(customerInstance, stripeCardId, callback) {
    if (typeof stripeCardId !== 'string' || !stripeCardId) {
      return callback(new ContentError('No stripe card id provided'));
    }

    Card.api.customers.retrieveCard(customerInstance.id, stripeCardId, (err, cardData) => {
      if (err) {
        return callback(err);
      }

      const retrieved = new Card(customerInstance, {
        id: stripeCardId,
        address: {
          country: cardData.country
        },
        expiration: {
          month: cardData.exp_month,
          year: cardData.exp_year
        },
        last4: cardData.last4,
        brand: cardData.brand,
        name: cardData.name
      }, cardData);

      callback(null, retrieved);
    });
  }
}

module.exports = Card;
