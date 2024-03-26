'use strict'

class StoreVisitorRegister {
  get rules() {
    return {
      email: 'required|email|unique:visitors,email',
      password: 'required'
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreVisitorRegister
