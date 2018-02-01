const Stripe = require('../');
const { UnexpectedError, ContentError} = require('err');

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

  async save() {
    if (this.id) {
      return await this[updateCard]();
    }
    return await this[createCard]();
  }

  async [createCard]() {
    if (!this.customer || !this.customer.id) {
      throw new UnexpectedError('No stripe customer id present');
    }

    const cardData = await Card.api.customers.createSource(this.customer.id, {
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
    });

    this.id = cardData.id;
    this.rawData = cardData;
    return this;
  }

  async [updateCard]() {
    if (!this.customer || !this.customer.id) {
      throw new UnexpectedError('No stripe customer id present');
    }

    const cardData = await Card.api.customers.updateCard(this.customer.id, this.id, {
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
    });

    this.rawData = cardData;
    return this;
  }

  static async retrieve(customerInstance, stripeCardId) {
    if (typeof stripeCardId !== 'string' || !stripeCardId) {
      throw new ContentError('No stripe card id provided');
    }

    const cardData = await Card.api.customers.retrieveCard(customerInstance.id, stripeCardId);

    return new Card(customerInstance, {
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
  }

  static async delete(customerInstance, stripeCardId) {
    if (typeof stripeCardId !== 'string' || !stripeCardId) {
      throw new ContentError('No stripe card id provided');
    }

    // returns a confirmation
    return await Card.api.customers.deleteCard(customerInstance.id, stripeCardId);
  }
}

module.exports = Card;
