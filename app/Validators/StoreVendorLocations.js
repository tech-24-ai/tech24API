'use strict'

class StoreVendorLocations {
  get rules() {
    return {
      country_id: 'required'
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreVendorLocations
