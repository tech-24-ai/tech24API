'use strict'

class StoreQuestion {
  get rules() {
    return {
      step_id: 'required',
      name: 'required',
      option_type: 'required',
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreQuestion
