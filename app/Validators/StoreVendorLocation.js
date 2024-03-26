'use strict'

class StoreVendorLocation {

  get rules() {
    return {
        office_location: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreVendorLocation
