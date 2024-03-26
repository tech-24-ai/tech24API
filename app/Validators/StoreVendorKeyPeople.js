'use strict'

class StoreVendorKeyPeople {

  get rules() {
    const id = this.ctx.params.id
    if (id) {
      return {
        name: `required`,
        designation: `required`,
      }
    } else {
      return {
        name: 'required',
        designation: 'required',
      }
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreVendorKeyPeople