'use strict'

class StoreContact {
  get rules() {
    return {
      contact_type_id: 'required',
      organisation_name: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreContact
