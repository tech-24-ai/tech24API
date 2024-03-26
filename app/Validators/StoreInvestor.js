'use strict'

class StoreInvestor {
  get rules() {
    const id = this.ctx.params.id
    if (id) {
      return {
        name: 'required',
        mobile: 'required',
        email: `required|unique:investors,email,id,${id}`,
      }
    } else {
      return {
        name: 'required',
        mobile: 'required',
        email: 'required|unique:investors,email',
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

module.exports = StoreInvestor
