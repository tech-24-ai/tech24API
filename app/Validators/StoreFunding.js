'use strict'

class StoreFunding {
  get rules() {
    return {
      vendor_id: 'required',
      type_of_funding: 'required',
      funded_by: 'required',
      date_of_funding: 'required',
      currency: 'required',
      funding_amount: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreFunding
