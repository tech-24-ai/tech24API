'use strict'

class StoreRegister {
  get rules() {
    return {
      email: 'required|email|unique:users,email',
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

module.exports = StoreRegister
