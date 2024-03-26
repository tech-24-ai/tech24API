'use strict'

class StoreAcquisition {
  get rules() {
    return {
      vendor_id: 'required',
      acquired_company_name: 'required',
      date_of_acquisition: 'required',
      currency: 'required',
      acquired_amount: 'required',
      website: 'required'
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreAcquisition
