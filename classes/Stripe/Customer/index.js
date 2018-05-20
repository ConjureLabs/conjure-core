const Stripe = require('../')
const { UnexpectedError, NotFoundError } = require('@conjurelabs/err')

const createCustomer = Symbol('create customer')
const updateCustomer = Symbol('update existing customer')

class Customer extends Stripe {
  constructor(conjureId, data, rawData) {
    super(...arguments)

    if (data.id) {
      this.id = data.id
    }
    this.conjureId = conjureId
    this.email = data.email
    this.name = data.name

    if (rawData) {
      this.rawData = rawData
    }
  }

  async save() {
    if (this.id) {
      return await this[updateCustomer]()
    }
    return await this[createCustomer]()
  }

  static async retrieve(conjureId, stripeId) {
    const customerData = await Customer.api.customers.retrieve(stripeId)

    return new Customer(conjureId, {
      id: customerData.id,
      email: customerData.email,
      name: customerData.metadata.name
    }, customerData)
  }

  async [createCustomer]() {
    const customerData = await Customer.api.customers.create({
      email: this.email,
      metadata: {
        conjureId: this.conjureId,
        name: this.name
      }
    })

    this.id = customerData.id
    this.rawData = customerData
    return this
  }

  async [updateCustomer]() {
    const customerData = await Customer.api.customers.update(this.id, {
      email: this.email,
      metadata: {
        conjureId: this.conjureId,
        name: this.name
      }
    })

    this.rawData = customerData
    return this
  }

  static async getRecordFromReq(req) {
    const { DatabaseTable } = require('@conjurelabs/db')
    const accountTable = new DatabaseTable('account')

    const accountRows = await accountTable.select({
      id: req.user.id
    })

    // should not be possible
    if (!accountRows.length) {
      throw new UnexpectedError('Could not find account record')
    }

    // should not be possible
    if (accountRows.length > 1) {
      throw new UnexpectedError('Expected a single row for account record, received multiple')
    }

    const account = accountRows[0]

    // if no account stripe_id, then error, since we expect it
    if (typeof account.stripe_id !== 'string' || !account.stripe_id) {
      throw new NotFoundError('Account is not associated to any Stripe records')
    }

    return await this.retrieve(req.user.id, account.stripe_id)
  }
}

module.exports = Customer
