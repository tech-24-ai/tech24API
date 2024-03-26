'use strict'

class StoreUser {
  get rules() {

    const id = this.ctx.params.id
    if (id) {
      return {
        name: 'required',
        email: `required|unique:users,email,id,${id}`,
      }
    } else {
      return {
        name: 'required',
        email: 'required|unique:users,email',
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

module.exports = StoreUser
