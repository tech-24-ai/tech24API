'use strict'

class StoreMiContact {
  get rules() {
    return {
      message: 'required',      
    }
  }

  get validateAll() {
    return true
  }

  async fails(errorMessages) {
    return this.ctx.response.status(422).send(errorMessages)
  }
}

module.exports = StoreMiContact
