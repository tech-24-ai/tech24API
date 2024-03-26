'use strict'

class StoreVendorCategory {
  get rules() {
    return {
      name: 'required'
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreVendorCategory
