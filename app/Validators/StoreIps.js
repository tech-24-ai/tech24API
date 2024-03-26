'use strict'

class StoreIps {
  get rules() {
    return {
      vendor_id: 'required',
      year: 'required',
      quarter: 'required',
      patent_count: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreIps
