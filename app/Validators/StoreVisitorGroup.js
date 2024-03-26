'use strict'

class StoreVisitorGroup {
  get rules() {
    return {
      name: 'required|unique:name'
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreVisitorGroup
