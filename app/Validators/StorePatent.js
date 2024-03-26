'use strict'

class StoreIps {
  get rules() {
    return {
      vendor_id: 'required',
      number: 'required',
      title: 'required',
      date: 'required',
      year: 'required',
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
